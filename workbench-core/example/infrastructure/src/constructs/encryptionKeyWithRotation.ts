/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-new */
import { Aws, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { AccountPrincipal, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface EncryptionKeyWithRotationProps {
  encryptionKeyOutputName: string;
}

export class EncryptionKeyWithRotation extends Construct {
  public key: Key;

  public constructor(scope: Construct, id: string, props?: EncryptionKeyWithRotationProps) {
    super(scope, id);

    const mainKeyPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['kms:*'],
          principals: [new AccountPrincipal(Aws.ACCOUNT_ID)],
          resources: ['*'],
          sid: 'main-key-share-statement'
        })
      ]
    });

    this.key = new Key(this, 'EncryptionKey', {
      removalPolicy: RemovalPolicy.DESTROY,
      enableKeyRotation: true,
      policy: mainKeyPolicy,
      alias: `alias/${id}`
    });

    const encryptionKeyOutputName: string = props ? props.encryptionKeyOutputName : 'EncryptionKeyOutput';

    new CfnOutput(this, encryptionKeyOutputName, {
      value: this.key.keyArn
    });
  }
}
