/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs';
import { join } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';
import { AuditService, BaseAuditPlugin, AuditLogger } from '@aws/workbench-core-audit';
import {
  WBCGroupManagementPlugin,
  DDBDynamicAuthorizationPermissionsPlugin,
  DynamicAuthorizationService
} from '@aws/workbench-core-authorization';
import { AwsService } from '@aws/workbench-core-base';
import {
  AuthorizationSetup,
  CognitoSetup,
  ServiceCatalogSetup,
  EnvironmentTypeSetup
} from '@aws/workbench-core-environments';
import { LoggingService } from '@aws/workbench-core-logging';
import { UserManagementService, CognitoUserManagementPlugin } from '@aws/workbench-core-user-management';
import axios from 'axios';
import { authorizationGroupPrefix, getConstants, getConstantsWithSecrets } from './constants';

async function run(): Promise<void> {
  const {
    AWS_REGION,
    S3_ARTIFACT_BUCKET_SC_PREFIX,
    SC_PORTFOLIO_NAME,
    S3_ARTIFACT_BUCKET_ARN_OUTPUT_KEY,
    LAUNCH_CONSTRAINT_ROLE_OUTPUT_KEY,
    STACK_NAME,
    ROOT_USER_EMAIL,
    USER_POOL_NAME,
    DYNAMIC_AUTH_TABLE_TAME
  } = await getConstantsWithSecrets();
  const scSetup = new ServiceCatalogSetup({
    AWS_REGION,
    S3_ARTIFACT_BUCKET_SC_PREFIX,
    SC_PORTFOLIO_NAME,
    S3_ARTIFACT_BUCKET_ARN_OUTPUT_KEY,
    LAUNCH_CONSTRAINT_ROLE_OUTPUT_KEY,
    STACK_NAME
  });
  const cognitoSetup = new CognitoSetup({
    AWS_REGION,
    ROOT_USER_EMAIL,
    USER_POOL_NAME
  });

  const dynamicAuthAwsService = new AwsService({
    region: AWS_REGION,
    ddbTableName: DYNAMIC_AUTH_TABLE_TAME
  });

  const userPoolId = await cognitoSetup.getUserPoolId();
  const logger: LoggingService = new LoggingService();
  const wbcGroupManagementPlugin: WBCGroupManagementPlugin = new WBCGroupManagementPlugin({
    userManagementService: new UserManagementService(
      new CognitoUserManagementPlugin(userPoolId!, dynamicAuthAwsService)
    ),
    ddbService: dynamicAuthAwsService.helpers.ddb,
    userGroupKeyType: authorizationGroupPrefix
  });
  const ddbDynamicAuthorizationPermissionsPlugin: DDBDynamicAuthorizationPermissionsPlugin =
    new DDBDynamicAuthorizationPermissionsPlugin({
      dynamoDBService: dynamicAuthAwsService.helpers.ddb
    });
  const authService: DynamicAuthorizationService = new DynamicAuthorizationService({
    groupManagementPlugin: wbcGroupManagementPlugin,
    dynamicAuthorizationPermissionsPlugin: ddbDynamicAuthorizationPermissionsPlugin,
    auditService: new AuditService(new BaseAuditPlugin(new AuditLogger(logger)))
  });

  const authSetup = new AuthorizationSetup(authService, {
    ROOT_USER_EMAIL
  });

  const awsService = new AwsService({
    region: AWS_REGION,
    ddbTableName: STACK_NAME
  });

  const cfnFilePaths: string[] = scSetup.getCfnTemplate(join(__dirname, '../../src/environment'));
  await scSetup.run(cfnFilePaths);
  await setupEnvironmentTypes(awsService, SC_PORTFOLIO_NAME);
  await cognitoSetup.run();
  await authSetup.run();
  await uploadOnboardAccountCfnToS3(awsService);
  await uploadBootstrapScriptsToS3(awsService);
}

async function setupEnvironmentTypes(awsService: AwsService, portfolioName: string): Promise<void> {
  console.log('Setting up Environment Types in the database');
  const envTypeHandler = new EnvironmentTypeSetup(awsService);
  await envTypeHandler.run(portfolioName);
}

async function uploadOnboardAccountCfnToS3(awsService: AwsService): Promise<void> {
  console.log('Uploading onboard-account.cfn.yaml to S3');
  const onboardAccountFilePath = join(__dirname, '../../src/templates/onboard-account.cfn.yaml');
  const onboardAccountFile = fs.readFileSync(onboardAccountFilePath);
  const s3Service = awsService.helpers.s3;
  const s3ArtifactBucketArn = await getS3BucketArn(awsService);
  await s3Service.uploadFiles(s3ArtifactBucketArn, [
    { fileContent: onboardAccountFile, fileName: 'onboard-account.cfn.yaml', s3Prefix: '' }
  ]);
  console.log('Finished uploading onboard-account.cfn.yaml to S3');
}

async function uploadBootstrapScriptsToS3(awsService: AwsService): Promise<void> {
  const { S3_ARTIFACT_BUCKET_BOOTSTRAP_PREFIX } = getConstants();
  const s3ArtifactBucketArn = await getS3BucketArn(awsService);
  const s3BucketName = s3ArtifactBucketArn.split(':').pop() as string;

  // resolve full folder path
  const scriptsPath = join(__dirname, '../../src/environment-files');
  console.log('Uploading offline file-system binary packages');

  const s3Service = awsService.helpers.s3;
  console.log(
    `Uploading offline environment bootstrap scripts to S3 bucket ${s3BucketName}, path: ${S3_ARTIFACT_BUCKET_BOOTSTRAP_PREFIX}`
  );
  await s3Service.uploadFolder(s3BucketName, S3_ARTIFACT_BUCKET_BOOTSTRAP_PREFIX, scriptsPath);
  console.log('Finished uploading offline environment bootstrap scripts to S3');
}

async function getS3BucketArn(awsService: AwsService): Promise<string> {
  const { S3_ARTIFACT_BUCKET_ARN_OUTPUT_KEY, STACK_NAME } = getConstants();
  const cfService = awsService.helpers.cloudformation;
  const { [S3_ARTIFACT_BUCKET_ARN_OUTPUT_KEY]: s3ArtifactBucketArn } = await cfService.getCfnOutput(
    STACK_NAME,
    [S3_ARTIFACT_BUCKET_ARN_OUTPUT_KEY]
  );
  return s3ArtifactBucketArn;
}

/* eslint-disable-next-line @typescript-eslint/no-floating-promises*/
(async (): Promise<void> => {
  await run();
})();
