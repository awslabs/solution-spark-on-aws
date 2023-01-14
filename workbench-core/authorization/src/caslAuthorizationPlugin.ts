/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import {
  Ability,
  AbilityBuilder,
  ForbiddenError as CASLForbiddenError,
  subject as Subject
} from '@casl/ability';
import _ from 'lodash';
import AuthorizationPlugin from './authorizationPlugin';
import { DynamicOperation } from './dynamicAuthorization/dynamicAuthorizationInputs/dynamicOperation';
import { IdentityPermission } from './dynamicAuthorization/dynamicAuthorizationInputs/identityPermission';
import { ForbiddenError } from './errors/forbiddenError';
import Operation from './operation';
import Permission from './permission';
/**
 * {@link https://github.com/stalniy/casl | CASL } Authorization Plugin.
 *
 */
export default class CASLAuthorizationPlugin implements AuthorizationPlugin {
  public async isAuthorized(userPermissions: Permission[], operations: Operation[]): Promise<void> {
    const ability: Ability = this._defineAbilitiesForUserPermissions(userPermissions);
    try {
      operations.forEach((operation: Operation) => {
        CASLForbiddenError.from(ability).throwUnlessCan(operation.action, operation.subject, operation.field);
      });
    } catch (err) {
      throw new ForbiddenError(err.message);
    }
  }

  public async isAuthorizedOnDynamicOperations(
    identityPermissions: IdentityPermission[],
    dynamicOperations: DynamicOperation[]
  ): Promise<void> {
    const ability: Ability = this._defineAbilitiesForIdentityPermissions(identityPermissions);
    try {
      dynamicOperations.forEach((dynamicOperation: DynamicOperation) => {
        const { subject } = dynamicOperation;
        const attributes = {
          ..._.omit(subject, 'subjectType')
        };
        const requestedSubject = Subject(subject.subjectType, attributes);
        CASLForbiddenError.from(ability).throwUnlessCan(
          dynamicOperation.action,
          requestedSubject,
          dynamicOperation.field
        );
      });
    } catch (err) {
      throw new ForbiddenError(err.message);
    }
  }
  /**
   * Given a set of a user's {@link  Permission}s, an CASL {@link Ability} is created.
   * @param userPermissions - a set of a user's {@link Permission}s.
   * @returns a CASL {@link Ability}.
   */
  private _defineAbilitiesForUserPermissions(userPermissions: Permission[]): Ability {
    const { can, cannot, rules } = new AbilityBuilder(Ability);

    userPermissions.forEach((permission: Permission) => {
      const reason: string = permission.reason ?? 'Permission Not Granted';
      if (permission.effect === 'ALLOW') can(permission.action, permission.subject, permission.fields);
      else cannot(permission.action, permission.subject, permission.fields).because(reason);
    });
    return new Ability(rules);
  }

  /**
   * Given a set of {@link IdentityPermission}s, a CASL {@link Ability} is created.
   * @param identityPermissions - a set of {@link IdentityPermission}s.
   * @returns a CASL {@link Ability}
   */
  private _defineAbilitiesForIdentityPermissions(identityPermissions: IdentityPermission[]): Ability {
    const { can, cannot, rules } = new AbilityBuilder(Ability);
    identityPermissions.forEach((identityPermission) => {
      const conditions = {
        ...(identityPermission.conditions ?? {}),
        //wildcards do not count as a condition
        ...(identityPermission.subjectId === '*' ? {} : { subjectId: identityPermission.subjectId })
      };
      if (identityPermission.effect === 'ALLOW')
        can(identityPermission.action, identityPermission.subjectType, identityPermission.fields, conditions);
      else
        cannot(
          identityPermission.action,
          identityPermission.subjectType,
          identityPermission.fields,
          conditions
        );
    });
    return new Ability(rules);
  }
}
