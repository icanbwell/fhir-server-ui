export const CONNECTIONS_FORBIDDEN_MESSAGE =
    'Connections are not available for delegated/authorized-representative accounts.';

// Shown instead of CONNECTIONS_FORBIDDEN_MESSAGE for a 403 in on-behalf-of (personId-present)
// mode — that message's "delegated/authorized-representative" wording is specific to ATS's
// restrict_delegated_user_rest guard on member JWTs, which is meaningless for the
// service-authenticated session the on-behalf-of flow uses.
export const CONNECTIONS_NOT_AVAILABLE_MESSAGE =
    'Connections are not available for this person right now.';
