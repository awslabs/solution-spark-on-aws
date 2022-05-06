/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { EnvironmentLifecycleService, EnvironmentLifecycleHelper, StatusMap } from '@amzn/environments';
import { AwsService } from '@amzn/workbench-core-base';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export default class SagemakerEnvironmentLifecycleService implements EnvironmentLifecycleService {
  public helper: EnvironmentLifecycleHelper;
  public aws: AwsService;
  public constructor() {
    this.helper = new EnvironmentLifecycleHelper();
    this.aws = new AwsService({ region: process.env.AWS_REGION!, ddbTableName: process.env.STACK_NAME! });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async launch(envMetadata: any): Promise<{ [id: string]: string }> {
    // Check if launch operation is valid for request body
    if (envMetadata.envId) {
      throw new Error('envId cannot be passed in the request body when trying to launch a new environment');
    }

    // Get value from account in DDB
    const accountEntry = await this.aws.helpers.ddb
      .get({ pk: { S: `ACC#${envMetadata.accountId}` }, sk: { S: `ACC#${envMetadata.accountId}` } })
      .execute();
    const accountDetails = 'Item' in accountEntry ? accountEntry.Item : undefined;
    const hostingAccountEventBusArn = accountDetails!.eventBusArn!.S!;
    const encryptionKeyArn = accountDetails!.encryptionKeyArn!.S!;
    const vpcId = accountDetails!.vpcId!.S!;
    const subnetId = accountDetails!.subnetId!.S!;
    const cidr = accountDetails!.cidr!.S!;
    const environmentInstanceFiles = accountDetails!.environmentInstanceFiles!.S!;

    const envId = uuidv4();

    // Future: Move some of these values to a envTypeConfig object in DDB
    const ssmParameters = {
      InstanceName: [`basicnotebookinstance-${Date.now()}`],
      VPC: [vpcId],
      Subnet: [subnetId],
      ProvisioningArtifactId: [envMetadata.provisioningArtifactId],
      ProductId: [envMetadata.productId],
      Namespace: [`sagemaker-${Date.now()}`],
      EncryptionKeyArn: [encryptionKeyArn],
      CIDR: [cidr],
      EventBusName: [hostingAccountEventBusArn],
      EnvId: [envId],
      EnvironmentInstanceFiles: [environmentInstanceFiles],
      AutoStopIdleTimeInMinutes: ['0'],
      EnvStatusUpdateConstString: [process.env.ENV_STATUS_UPDATE!]
    };

    await this.helper.launch({
      ssmParameters,
      operation: 'Launch',
      envType: 'Sagemaker',
      accountId: accountDetails!.accountId!.S!,
      productId: envMetadata.productId
    });

    const envDetails = {
      id: { S: envId },
      accountId: { S: envMetadata.accountId },
      awsAccountId: { S: accountDetails!.awsAccountId!.S! },
      envTypeId: { S: `${envMetadata.productId}-${envMetadata.provisioningArtifactId}` },
      resourceType: { S: 'environment' },
      status: { N: StatusMap.PENDING }
    };

    // Store env row in DDB
    await this.helper.storeToDdb(`ENV#${envId}`, `ENV#${envId}`, envDetails);

    // Store env-account row in DDB
    await this.helper.storeToDdb(`ENV#${envId}`, `ACC#${envMetadata.accountId}`, accountDetails!);

    return { ...envMetadata, envId, status: 'PENDING' };
  }

  public async terminate(envId: string): Promise<{ [id: string]: string }> {
    // Get value from env in DDB
    const envEntry = await this.aws.helpers.ddb
      .get({ pk: { S: `ENV#${envId}` }, sk: { S: `ENV#${envId}` } })
      .execute();
    const envDetails = 'Item' in envEntry ? envEntry.Item : undefined;
    const accountId = envDetails!.accountId!.S!;
    const provisionedProductId = envDetails!.provisionedProductId!.S!; // This is updated by status handler

    // Get envMetadata for the given envId from DDB
    const envMetadata = { envId, accountId, provisionedProductId };

    // Get value from aws-accounts in DDB
    const accountEntry = await this.aws.helpers.ddb
      .get({ pk: { S: `ACC#${accountId}` }, sk: { S: `ACC#${accountId}` } })
      .execute();
    const accountDetails = 'Item' in accountEntry ? accountEntry.Item : undefined;
    const hostingAccountEventBusArn = accountDetails!.eventBusArn!.S!;

    const ssmParameters = {
      ProvisionedProductId: [provisionedProductId],
      TerminateToken: [uuidv4()],
      EventBusName: [hostingAccountEventBusArn],
      EnvId: [envId],
      EnvStatusUpdateConstString: [process.env.ENV_STATUS_UPDATE!]
    };

    // Execute termination doc
    await this.helper.executeSSMDocument({
      ssmParameters,
      operation: 'Terminate',
      envType: 'Sagemaker',
      accountId: envMetadata.accountId
    });

    envDetails!.status = { N: StatusMap.TERMINATING };

    // Store env row in DDB
    await this.helper.storeToDdb(`ENV#${envId}`, `ENV#${envId}`, envDetails!);

    return { envId, status: 'TERMINATING' };
  }

  public async start(envId: string): Promise<{ [id: string]: string }> {
    // Get value from env in DDB
    const envEntry = await this.aws.helpers.ddb
      .get({ pk: { S: `ENV#${envId}` }, sk: { S: `ENV#${envId}` } })
      .execute();

    const envDetails = 'Item' in envEntry ? envEntry.Item : undefined;
    const accountId = envDetails!.accountId!.S!;

    const key = { key: { name: 'pk', value: { S: `ENV#${envId}` } } };
    const ddbEntries = await this.aws.helpers.ddb.query(key).execute();
    const instanceRecord = _.find(ddbEntries.Items!, (entry) => {
      return entry!.sk!.S!.startsWith('INID#');
    });
    const instanceName = instanceRecord!.sk!.S!.split('INID#')[1];

    const startParams = {
      NotebookInstanceName: instanceName
    };

    // Start the instance on hosting account
    const hostSdk = await this.helper.getAwsSdkForEnvMgmtRole({
      operation: 'Start',
      envType: 'Sagemaker',
      accountId
    });
    await hostSdk.clients.sagemaker.startNotebookInstance(startParams);

    // Store env row in DDB
    envDetails!.status = { N: StatusMap.STARTING };
    await this.helper.storeToDdb(`ENV#${envId}`, `ENV#${envId}`, envDetails!);

    return { envId, status: 'STARTING' };
  }

  public async stop(envId: string): Promise<{ [id: string]: string }> {
    // Get value from env in DDB
    const envEntry = await this.aws.helpers.ddb
      .get({ pk: { S: `ENV#${envId}` }, sk: { S: `ENV#${envId}` } })
      .execute();

    const envDetails = 'Item' in envEntry ? envEntry.Item : undefined;
    const accountId = envDetails!.accountId!.S!;

    const key = { key: { name: 'pk', value: { S: `ENV#${envId}` } } };
    const ddbEntries = await this.aws.helpers.ddb.query(key).execute();
    const instanceRecord = _.find(ddbEntries.Items!, (entry) => {
      return entry!.sk!.S!.startsWith('INID#');
    });
    const instanceName = instanceRecord!.sk!.S!.split('INID#')[1];

    const startParams = {
      NotebookInstanceName: instanceName
    };

    // Stop the instance on hosting account
    const hostSdk = await this.helper.getAwsSdkForEnvMgmtRole({
      operation: 'Stop',
      envType: 'Sagemaker',
      accountId
    });
    await hostSdk.clients.sagemaker.stopNotebookInstance(startParams);

    // Store env row in DDB
    envDetails!.status = { N: StatusMap.STOPPING };
    await this.helper.storeToDdb(`ENV#${envId}`, `ENV#${envId}`, envDetails!);

    return { envId, status: 'STOPPING' };
  }
}
