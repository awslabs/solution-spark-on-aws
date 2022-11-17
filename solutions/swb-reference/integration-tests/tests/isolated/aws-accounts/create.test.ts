/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
import { resourceTypeToKey } from '@aws/workbench-core-base';
import _ from 'lodash';
import ClientSession from '../../../support/clientSession';
import { AccountHelper } from '../../../support/complex/accountHelper';
import Account from '../../../support/resources/accounts/account';
import Setup from '../../../support/setup';
import HttpError from '../../../support/utils/HttpError';
import RandomTextGenerator from '../../../support/utils/randomTextGenerator';
import { checkHttpError } from '../../../support/utils/utilities';

describe('awsAccounts create negative tests', () => {
  const setup: Setup = new Setup();
  let adminSession: ClientSession;
  const randomTextGenerator = new RandomTextGenerator(setup.getSettings().get('runId'));

  beforeEach(() => {
    expect.hasAssertions();
  });

  beforeAll(async () => {
    adminSession = await setup.getDefaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  const validLaunchParameters = {
    awsAccountId: randomTextGenerator.getFakeText('fakeAccount'),
    envMgmtRoleArn: randomTextGenerator.getFakeText('fakeEnvMgmtRoleArn'),
    hostingAccountHandlerRoleArn: randomTextGenerator.getFakeText('fakeHostingAccountHandlerRoleArn'),
    name: randomTextGenerator.getFakeText('fakeName'),
    externalId: randomTextGenerator.getFakeText('fakeExternalId')
  };

  describe('when creating an account', () => {
    describe('and the creation params are invalid', () => {
      test('it throws a validation error', async () => {
        try {
          await adminSession.resources.accounts.create({}, false);
        } catch (e) {
          checkHttpError(
            e,
            new HttpError(400, {
              statusCode: 400,
              error: 'Bad Request',
              message:
                "requires property 'awsAccountId'. requires property 'envMgmtRoleArn'. requires property 'hostingAccountHandlerRoleArn'. requires property 'name'. requires property 'externalId'"
            })
          );
        }
      });
    });
    describe('and the account is already onboarded', () => {
      test('it throws an error', async () => {
        const accountHelper = new AccountHelper();
        const invalidParam: { [id: string]: string } = { ...validLaunchParameters };
        const existingAccounts = await accountHelper.listOnboardedAccounts();

        if (existingAccounts.length === 0) {
          console.log('No hosting accounts have been onboarded. Skipping this test.');
          return;
        }

        invalidParam.awsAccountId = _.first(existingAccounts)!.awsAccountId;
        try {
          await adminSession.resources.accounts.create(invalidParam, false);
        } catch (e) {
          checkHttpError(
            e,
            new HttpError(400, {
              statusCode: 400,
              error: 'Bad Request',
              message:
                'This AWS Account was found in DDB. Please provide the correct id value in request body'
            })
          );
        }
      });
    });
  });
  describe('when updating an account', () => {
    const accountId = `${resourceTypeToKey.account.toLowerCase()}-00000000-0000-0000-0000-000000000000`;
    let account: Account;
    beforeEach(() => {
      account = adminSession.resources.accounts.account(accountId);
    });
    describe('and the update params are invalid', () => {
      test('it throws a validation error', async () => {
        try {
          const badValue = 1 as unknown as string;

          await account.update({
            name: badValue,
            awsAccountId: badValue,
            envMgmtRoleArn: badValue,
            hostingAccountHandlerRoleArn: badValue,
            externalId: badValue
          });
        } catch (e) {
          checkHttpError(
            e,
            new HttpError(400, {
              statusCode: 400,
              error: 'Bad Request',
              message:
                'name is not of a type(s) string. awsAccountId is not of a type(s) string. envMgmtRoleArn is not of a type(s) string. hostingAccountHandlerRoleArn is not of a type(s) string. externalId is not of a type(s) string'
            })
          );
        }
      });
    });
  });
});
