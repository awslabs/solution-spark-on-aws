/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { nonEmptyMessage } from '@aws/workbench-core-base';
import ClientSession from '../../../support/clientSession';
import { PaabHelper } from '../../../support/complex/paabHelper';
import HttpError from '../../../support/utils/HttpError';
import { checkHttpError } from '../../../support/utils/utilities';

describe('List Cost Center negative tests', () => {
  const paabHelper = new PaabHelper();
  let adminSession: ClientSession;

  beforeEach(async () => {
    expect.hasAssertions();
  });

  beforeAll(async () => {
    ({ adminSession } = await paabHelper.createResources());
  });

  afterAll(async () => {
    await paabHelper.cleanup();
  });

  describe('with filter', () => {
    describe('with name that is empty', () => {
      beforeEach(async () => {});

      test('it throws 400 error', async () => {
        try {
          await adminSession.resources.costCenters.get({
            filter: { name: { eq: '' } }
          });
        } catch (e) {
          checkHttpError(
            e,
            new HttpError(400, {
              error: 'Bad Request',
              message: `filter.name.eq: ${nonEmptyMessage}`
            })
          );
        }
      });
    });
  });
});