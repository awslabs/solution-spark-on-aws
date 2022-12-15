/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
import ClientSession from '../../clientSession';
import { DEFLAKE_DELAY_IN_MILLISECONDS } from '../../utils/constants';
import { sleep } from '../../utils/utilities';
import Resource from '../base/resource';

export default class EnvironmentTypeConfig extends Resource {
  private _parentId: string;
  public constructor(id: string, clientSession: ClientSession, parentApi: string, parentId: string) {
    super(clientSession, 'environmentTypeConfig', id, parentApi);
    this._parentId = parentId;
  }

  protected async cleanup(): Promise<void> {
    const defAdminSession = await this._setup.getDefaultAdminSession();
    await sleep(DEFLAKE_DELAY_IN_MILLISECONDS); //Avoid throttling when terminating multiple environment type configs
    await defAdminSession.resources.environmentTypes
      .environmentType(this._parentId)
      .configurations()
      .environmentTypeConfig(this._id)
      .delete();
  }
}