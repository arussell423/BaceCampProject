/**
 * Simple singleton to let any screen directly trigger an App-level role change
 * without going through Firestore onSnapshot delays.
 */
let _callback = null;

export const registerRoleChangeCallback = (fn) => {
  _callback = fn;
};

export const triggerRoleChange = (newRole) => {
  if (_callback) _callback(newRole);
};
