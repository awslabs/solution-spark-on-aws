/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
import { AxiosResponse } from 'axios';
import ClientSession from '../../clientSession';
import Resource from '../base/resource';

export default class Project extends Resource {
  private _clientSession: ClientSession;
  public constructor(id: string, clientSession: ClientSession, parentApi: string) {
    super(clientSession, 'project', id, parentApi);
    this._clientSession = clientSession;
  }

  public async softDelete(): Promise<AxiosResponse> {
    return this._axiosInstance.put(`${this._api}/softDelete`);
  }

  protected async cleanup(): Promise<void> {}
}
