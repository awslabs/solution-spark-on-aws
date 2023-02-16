/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
import ClientSession from '../../../support/clientSession';
import Setup from '../../../support/setup';
import HttpError from '../../../support/utils/HttpError';
import { checkHttpError, getFakeEnvId } from '../../../support/utils/utilities';

describe('environment terminate negative tests', () => {
  const setup: Setup = new Setup();
  let adminSession: ClientSession;

  beforeEach(() => {
    expect.hasAssertions();
  });

  beforeAll(async () => {
    adminSession = await setup.getDefaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  test('environment does not exist', async () => {
    const fakeEnvId = getFakeEnvId();
    try {
      await adminSession.resources.environments.environment(fakeEnvId).terminate();
    } catch (e) {
      checkHttpError(
        e,
        new HttpError(404, {
          error: 'Not Found',
          message: `Could not find environment ${fakeEnvId}`
        })
      );
    }
  });

  test('project does not exist', async () => {
    const fakeEnvId = getFakeEnvId();
    const fakeProjectId: string = 'proj-12345678-1234-1234-1234-123456789012';
    try {
      await adminSession.resources.environments.environment(fakeEnvId, fakeProjectId).terminate();
    } catch (e) {
      checkHttpError(
        e,
        new HttpError(404, {
          error: 'Not Found',
          message: `Could not find project ${fakeProjectId}`
        })
      );
    }
  });

  test('terminate an environment that is already terminated should return a 204 and not change the environment status', async () => {
    const envId = setup.getSettings().get('terminatedEnvId');
    const terminateResponse = await adminSession.resources.environments.environment(envId).terminate();
    expect(terminateResponse.status).toEqual(204);

    const envDetailResponse = await adminSession.resources.environments.environment(envId).get();
    expect(envDetailResponse.data.status).toEqual('TERMINATED');
  });
});
