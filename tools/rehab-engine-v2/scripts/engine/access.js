// ─────────────────────────────────────────────────────────────────────────────
// ACCESS GUARD  —  Program entitlement checker (v2)
//
// Reads PROGRAM.access and returns an access decision.
// Designed so a backend auth check can later replace or augment this.
//
// Supported access types:
//   one_off_purchase  — single program purchase
//   subscription      — recurring coaching subscription
//   complimentary     — free / gifted access
//   trial             — limited trial period
//
// Supported access statuses:
//   active    — full access granted
//   expired   — time or payment lapsed
//   suspended — coach / admin revoked temporarily
//   pending   — program not yet activated
//
// Returns: AccessResult = { allowed, reason, heading, body, cta }
// ─────────────────────────────────────────────────────────────────────────────

const AccessGuard = (function () {

  const MESSAGES = {
    expired: {
      subscription:     { heading: "Subscription Ended",   body: "Your coaching subscription has ended. Renew to continue accessing your program and sessions.", cta: "Contact Your Coach" },
      one_off_purchase: { heading: "Access Expired",        body: "Your program access period has ended. Contact your coach to discuss next steps.",               cta: "Contact Your Coach" },
      trial:            { heading: "Trial Ended",           body: "Your free trial has ended. Purchase a program or subscription to continue.",                    cta: "Get Full Access" },
      _default:         { heading: "Access Expired",        body: "Your access has expired. Please contact your coach.",                                           cta: "Contact Your Coach" },
    },
    suspended: {
      _default: { heading: "Access Suspended",  body: "Your access has been temporarily suspended. Please contact your coach to resolve this.",  cta: "Contact Your Coach" },
    },
    pending: {
      _default: { heading: "Program Pending",   body: "Your program is being set up and will be available soon. Check back shortly.",            cta: "Check Back Soon" },
    },
    _noAccess: {
      heading: "Access Required",
      body:    "You do not currently have access to this program. Contact your coach or purchase a plan to get started.",
      cta:     "Contact Your Coach",
    },
  };

  return {
    /**
     * Check whether the client has access to run the program.
     *
     * @param   {object} program  — the PROGRAM global
     * @returns {AccessResult}
     *
     * AccessResult = {
     *   allowed: boolean
     *   reason:  string | null       — null when allowed
     *   heading: string | null
     *   body:    string | null
     *   cta:     string | null
     * }
     */
    check(program) {
      const access = program?.access;

      // No access block at all — allow (backwards-compatible with older program files)
      if (!access) return _allow();

      const { status, type } = access;

      if (status === "active")    return _allow();
      if (!status)                return _allow();   // missing status = assume active

      const group   = MESSAGES[status] || null;
      if (!group) return _allow();                   // unknown status = allow + log

      const msg = group[type] || group["_default"] || MESSAGES._noAccess;

      return _deny(status, msg);
    },
  };

  function _allow() {
    return { allowed: true, reason: null, heading: null, body: null, cta: null };
  }

  function _deny(reason, { heading, body, cta }) {
    return { allowed: false, reason, heading, body, cta };
  }

})();
