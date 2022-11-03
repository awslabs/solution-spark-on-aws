import { IdentityPermission } from './identityPermission';

/**
 * Request object for DynamicPermissionsPlugin's deleteIdentityPermissions
 */
export interface DeleteIdentityPermissionsRequest {
  /**
   * An array of {@link IdentityPermission} to be deleted
   */
  identityPermissions: IdentityPermission[];
}

/**
 * Response object for DynamicPermissionsPlugin's deleteIdentityPermissions
 */
export interface DeleteIdentityPermissionsResponse {
  /**
   * States whether the {@link IdentityPermission}s were successfully deleted
   */
  deleted: boolean;
}
