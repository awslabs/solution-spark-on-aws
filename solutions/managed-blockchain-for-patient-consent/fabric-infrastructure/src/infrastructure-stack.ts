/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

import * as cdk from 'aws-cdk-lib';

import * as hyperledger from './components';

export class InfrastructureStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const networkId = this.node.tryGetContext('networkId');
    const invitationId = this.node.tryGetContext('invitationId');
    const additionalMembers = this.node.tryGetContext('additionalMembers');
    const accountId = cdk.Stack.of(this).account;
    const network = new hyperledger.HyperledgerFabricNetwork(this, 'V2TestNetwork', {
      networkName: 'TestNetwork',
      memberName: `TestMember-${accountId}`,
      networkEdition: hyperledger.NetworkEdition.STARTER,
      networkId,
      invitationId,
      additionalMembers,
      nodes: [
        {
          availabilityZone: 'us-east-1a',
          instanceType: hyperledger.InstanceType.BURSTABLE3_MEDIUM
        }
      ]
    });

    new cdk.CfnOutput(this, 'NetworkId', {
      description: 'Managed Blockchain network identifier',
      value: network.networkId
    });

    new cdk.CfnOutput(this, 'MemberId', {
      description: 'Managed Blockchain member identifier',
      value: network.memberId
    });

    new cdk.CfnOutput(this, 'VpcEndpointServiceName', {
      description: 'Managed Blockchain network VPC endpoint service name',
      value: network.vpcEndpointServiceName
    });

    new cdk.CfnOutput(this, 'OrdererEndpoint', {
      description: 'Managed Blockchain network ordering service endpoint',
      value: network.ordererEndpoint
    });

    new cdk.CfnOutput(this, 'CaEndpoint', {
      description: 'Managed Blockchain member CA endpoint',
      value: network.caEndpoint
    });

    new cdk.CfnOutput(this, 'AdminPasswordArn', {
      description: 'Secret ARN for the Hyperledger Fabric admin password',
      value: network.adminPasswordSecret.secretFullArn ?? network.adminPasswordSecret.secretArn
    });

    new cdk.CfnOutput(this, 'AdminPrivateKeyArn', {
      description: 'Secret ARN for Hyperledger Fabric admin private key',
      value: network.adminPrivateKeySecret.secretFullArn ?? network.adminPrivateKeySecret.secretArn
    });

    new cdk.CfnOutput(this, 'AdminSignedCertArn', {
      description: 'Secret ARN for Hyperledger Fabric admin signed certificate',
      value: network.adminSignedCertSecret.secretFullArn ?? network.adminSignedCertSecret.secretArn
    });

    new cdk.CfnOutput(this, 'NodeIds', {
      description: 'Comma-separated list of Managed Blockchain node identifiers',
      value: network.nodes.map((n) => n.nodeId).join(',')
    });

    new cdk.CfnOutput(this, 'NodeEndpoints', {
      description: 'Comma-separated list of Managed Blockchain node endpoints',
      value: network.nodes.map((n) => n.endpoint).join(',')
    });

    new cdk.CfnOutput(this, 'NodeEventEndpoints', {
      description: 'Comma-separated list of Managed Blockchain node event endpoints',
      value: network.nodes.map((n) => n.eventEndpoint).join(',')
    });

    /**
     * cdk-nag suppressions
     */
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-SMG4',
        reason: 'Secrets created for Managed Blockchain users do not support auto-rotation'
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'The CDK custom resource framework uses a managed policy for its Lambda'
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'The manageblockchain bucket is a public bucket for cert chain sharing'
      }
    ]);
  }
}
