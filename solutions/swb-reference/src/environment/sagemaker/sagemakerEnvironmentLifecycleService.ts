/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import _ = require('lodash');
import {
  EnvironmentLifecycleService,
  EnvironmentLifecycleHelper,
  EnvironmentService
} from '@amzn/environments';
import { AwsService } from '@amzn/workbench-core-base';
import { v4 as uuidv4 } from 'uuid';

export default class SagemakerEnvironmentLifecycleService implements EnvironmentLifecycleService {
  public helper: EnvironmentLifecycleHelper;
  public aws: AwsService;
  public envService: EnvironmentService;
  public constructor() {
    this.helper = new EnvironmentLifecycleHelper();
    this.aws = new AwsService({ region: process.env.AWS_REGION!, ddbTableName: process.env.STACK_NAME! });
    this.envService = new EnvironmentService({ TABLE_NAME: process.env.STACK_NAME! });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async launch(envMetadata: any): Promise<{ [id: string]: string }> {
    const cidr = _.find(envMetadata.ETC.params, { key: 'CIDR' })!.value!;
    const instanceSize = _.find(envMetadata.ETC.params, { key: 'InstanceType' })!.value!;
    const autoStopIdleTimeInMinutes = _.find(envMetadata.ETC.params, { key: 'AutoStopIdleTimeInMinutes' })!
      .value!;

    const ssmParameters = {
      InstanceName: [`basicnotebookinstance-${Date.now()}`],
      VPC: [envMetadata.PROJ.vpcId],
      Subnet: [envMetadata.PROJ.subnetId],
      ProvisioningArtifactId: [envMetadata.ETC.provisioningArtifactId],
      ProductId: [envMetadata.ETC.productId],
      Namespace: [`sagemaker-${Date.now()}`],
      EncryptionKeyArn: [envMetadata.PROJ.encryptionKeyArn],
      CIDR: [cidr],
      InstanceType: [instanceSize],
      EnvId: [envMetadata.id],
      EnvironmentInstanceFiles: [envMetadata.PROJ.environmentInstanceFiles],
      AutoStopIdleTimeInMinutes: [autoStopIdleTimeInMinutes]
    };

    await this.helper.launch({
      ssmParameters,
      operation: 'Launch',
      envType: 'sagemaker',
      envMetadata
    });

    return { ...envMetadata, status: 'PENDING' };
  }

  public async terminate(envId: string): Promise<{ [id: string]: string }> {
    // Get value from env in DDB
    const envDetails = await this.envService.getEnvironment(envId, true);
    const provisionedProductId = envDetails.provisionedProductId!; // This is updated by status handler

    const ssmParameters = {
      ProvisionedProductId: [provisionedProductId],
      TerminateToken: [uuidv4()],
      EnvId: [envId]
    };

    // Execute termination doc
    await this.helper.executeSSMDocument({
      ssmParameters,
      operation: 'Terminate',
      envType: 'sagemaker',
      envMgmtRoleArn: envDetails.PROJ.envMgmtRoleArn,
      externalId: envDetails.PROJ.externalId
    });

    // Store env row in DDB
    await this.envService.updateEnvironment(envId, { status: 'TERMINATING' });

    return { envId, status: 'TERMINATING' };
  }

  public async start(envId: string): Promise<{ [id: string]: string }> {
    // Get value from env in DDB
    const envDetails = await this.envService.getEnvironment(envId, true);
    const instanceName = envDetails.instanceId;

    // Assume hosting account EnvMgmt role
    const hostAwsSdk = await this.helper.getAwsSdkForEnvMgmtRole({
      envMgmtRoleArn: envDetails.PROJ.envMgmtRoleArn,
      externalId: envDetails.PROJ.externalId,
      operation: 'Start',
      envType: 'sagemaker'
    });

    await hostAwsSdk.clients.sagemaker.startNotebookInstance({ NotebookInstanceName: instanceName });

    // Store env row in DDB
    await this.envService.updateEnvironment(envId, { status: 'STARTING' });

    return { envId, status: 'STARTING' };
  }

  public async stop(envId: string): Promise<{ [id: string]: string }> {
    // Get value from env in DDB
    const envDetails = await this.envService.getEnvironment(envId, true);
    const instanceName = envDetails.instanceId;

    // Assume hosting account EnvMgmt role
    const hostAwsSdk = await this.helper.getAwsSdkForEnvMgmtRole({
      envMgmtRoleArn: envDetails.PROJ.envMgmtRoleArn,
      externalId: envDetails.PROJ.externalId,
      operation: 'Start',
      envType: 'sagemaker'
    });

    await hostAwsSdk.clients.sagemaker.stopNotebookInstance({ NotebookInstanceName: instanceName });

    envDetails.status = 'STOPPING';

    // Store env row in DDB
    await this.envService.updateEnvironment(envId, { status: 'STOPPING' });

    return { envId, status: 'STOPPING' };
  }
}
