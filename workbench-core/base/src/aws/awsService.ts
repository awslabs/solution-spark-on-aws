/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import CloudFormation from './services/cloudformation';
import EC2 from './services/ec2';
import EventBridge from './services/eventbridge';
import SSM from './services/ssm';
import ServiceCatalog from './services/serviceCatalog';
import S3 from './services/s3';
import STS from './services/sts';
import { Credentials } from '@aws-sdk/types';
export default class AwsService {
  public cloudformation: CloudFormation;
  public ssm: SSM;
  public ec2: EC2;
  public eventBridge: EventBridge;
  public serviceCatalog: ServiceCatalog;
  public s3: S3;
  public sts: STS;

  public constructor(awsConfig: { AWS_REGION: string; credentials?: Credentials }) {
    const { AWS_REGION, credentials } = awsConfig;

    this.cloudformation = new CloudFormation({ region: AWS_REGION });
    this.ssm = new SSM({ region: AWS_REGION });
    this.ec2 = new EC2({ region: AWS_REGION });
    this.eventBridge = new EventBridge({ region: AWS_REGION });
    this.serviceCatalog = new ServiceCatalog({ region: AWS_REGION, credentials });
    this.s3 = new S3({ region: AWS_REGION });
    this.sts = new STS({ region: AWS_REGION });
  }
}
