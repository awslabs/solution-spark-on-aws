/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { dataSetPrefix } from '@aws/workbench-core-example-app/lib/configs/constants';
import { CreateUser } from '@aws/workbench-core-user-management';
import { v4 as uuidv4 } from 'uuid';
import ClientSession from '../../support/clientSession';
import Dataset from '../../support/resources/datasets/dataset';
import Setup from '../../support/setup';
import HttpError from '../../support/utils/HttpError';

describe('DataSets access permissions integration tests', () => {
  const setup: Setup = new Setup();
  const mockBadValue: string = 'fake-data';
  let adminSession: ClientSession;
  let user: CreateUser;
  let userId: string;

  beforeEach(() => {
    expect.hasAssertions();
  });

  beforeAll(async () => {
    adminSession = await setup.getDefaultAdminSession();
    user = {
      firstName: 'Test',
      lastName: 'User',
      email: `success+create-user-${uuidv4()}@simulator.amazonses.com`
    };
    const userData = await adminSession.resources.users.create(user);
    userId = userData.data.id;
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('addDataSetAccessPermissions', () => {
    it('Adds a read-only access permission.', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;
      await expect(
        (adminSession.resources.datasets.children.get(dataSetId) as Dataset).addAccess({
          permission: {
            identityType: 'GROUP',
            identity: groupId,
            accessLevel: 'read-only'
          }
        })
      ).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'GROUP',
              identity: groupId,
              accessLevel: 'read-only'
            }
          ]
        }
      });
    });
    it('Adds a read-write access permission when read-write is requested.', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;

      await expect(
        (adminSession.resources.datasets.children.get(dataSetId) as Dataset).addAccess({
          permission: {
            identityType: 'GROUP',
            identity: groupId,
            accessLevel: 'read-write'
          }
        })
      ).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'GROUP',
              identity: groupId,
              accessLevel: 'read-write'
            }
          ]
        }
      });
    });
    it('adds access permissions for a user.', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;

      await expect(
        (adminSession.resources.datasets.children.get(dataSetId) as Dataset).addAccess({
          permission: {
            identityType: 'USER',
            identity: userId,
            accessLevel: 'read-only'
          }
        })
      ).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'USER',
              identity: userId,
              accessLevel: 'read-only'
            }
          ]
        }
      });
    });
    it('throws if "identityType" is not "GROUP" or "USER"', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;
      await expect(
        (adminSession.resources.datasets.children.get(dataSetId) as Dataset).addAccess({
          permission: {
            identityType: mockBadValue,
            identity: groupId,
            accessLevel: 'read-only'
          }
        })
      ).rejects.toThrow(new HttpError(400, {}));
    });
    it('throws if "accessLevel" is not "read-only" or "read-write"', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;
      await expect(
        (adminSession.resources.datasets.children.get(dataSetId) as Dataset).addAccess({
          permission: {
            identityType: 'GROUP',
            identity: groupId,
            //@ts-ignore
            accessLevel: mockBadValue
          }
        })
      ).rejects.toThrow(new HttpError(400, {}));
    });
    it('throws if the DataSet does not exist.', async () => {
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;

      const fakeDataSet: Dataset = adminSession.resources.datasets.dataset({
        id: `${dataSetPrefix.toLowerCase()}-${uuidv4()}`,
        awsAccountId: mockBadValue,
        storageName: mockBadValue,
        storagePath: mockBadValue
      });

      await expect(
        fakeDataSet.addAccess({
          permission: {
            identityType: 'GROUP',
            identity: groupId,
            accessLevel: 'read-only'
          }
        })
      ).rejects.toThrow(new HttpError(404, {}));
    });
  });

  describe('getDatasetAllAccessPermissions', () => {
    it('throws if the DataSet does not exist.', async () => {
      const fakeDataSet: Dataset = adminSession.resources.datasets.dataset({
        id: `${dataSetPrefix.toLowerCase()}-${uuidv4()}`,
        awsAccountId: mockBadValue,
        storageName: mockBadValue,
        storagePath: mockBadValue
      });

      await expect(fakeDataSet.getAllAccess()).rejects.toThrow(new HttpError(404, {}));
    });
    it('gets a read-write permission for a group', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;

      const dataSet = adminSession.resources.datasets.children.get(dataSetId) as Dataset;
      await dataSet.addAccess({
        permission: {
          identityType: 'GROUP',
          identity: groupId,
          accessLevel: 'read-write'
        }
      });
      await expect(dataSet.getAllAccess()).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'GROUP',
              identity: groupId,
              accessLevel: 'read-write'
            }
          ]
        }
      });
    });
    it('gets multiple permissions on a dataset.', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;

      const dataSet = adminSession.resources.datasets.children.get(dataSetId) as Dataset;
      await dataSet.addAccess({
        permission: {
          identityType: 'GROUP',
          identity: groupId,
          accessLevel: 'read-write'
        }
      });
      await dataSet.addAccess({
        permission: {
          identityType: 'USER',
          identity: userId,
          accessLevel: 'read-only'
        }
      });
      await expect(dataSet.getAllAccess()).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'GROUP',
              identity: groupId,
              accessLevel: 'read-write'
            },
            {
              identityType: 'USER',
              identity: userId,
              accessLevel: 'read-only'
            }
          ]
        }
      });
    });
  });

  describe('getDatasetAccessPermissions', () => {
    it('throws if the DataSet does not exist.', async () => {
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;
      const fakeDataSet: Dataset = adminSession.resources.datasets.dataset({
        id: `${dataSetPrefix.toLowerCase()}-${uuidv4()}`,
        awsAccountId: mockBadValue,
        storageName: mockBadValue,
        storagePath: mockBadValue
      });

      await expect(fakeDataSet.getAccess('GROUP', groupId)).rejects.toThrow(new HttpError(404, {}));
    });
    it('Gets a read-write access permission for a group.', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;
      const createGroupResponse = await adminSession.resources.groups.create({}, true);
      const { groupId } = createGroupResponse.data;

      const dataSet = adminSession.resources.datasets.children.get(dataSetId) as Dataset;
      await dataSet.addAccess({
        permission: {
          identityType: 'GROUP',
          identity: groupId,
          accessLevel: 'read-write'
        }
      });
      await expect(dataSet.getAccess('GROUP', groupId)).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'GROUP',
              identity: groupId,
              accessLevel: 'read-write'
            }
          ]
        }
      });
    });
    it('Gets read-only access for a user.', async () => {
      const createDataSetResponse = await adminSession.resources.datasets.create({}, true);
      const dataSetId: string = createDataSetResponse.data.id;

      const dataSet = adminSession.resources.datasets.children.get(dataSetId) as Dataset;
      await dataSet.addAccess({
        permission: {
          identityType: 'USER',
          identity: userId,
          accessLevel: 'read-only'
        }
      });
      await expect(dataSet.getAccess('USER', userId)).resolves.toMatchObject({
        data: {
          dataSetId: dataSetId,
          permissions: [
            {
              identityType: 'USER',
              identity: userId,
              accessLevel: 'read-only'
            }
          ]
        }
      });
    });
  });
});