/* Shared sign-in session and backend calls for the Math Tests portal. */
var Portal = (function () {
  var KEY = 'mathPortalSession';
  function api() { return window.PORTAL_API || ''; }
  function session() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && s.token && s.exp > Date.now()) return s;
    } catch (e) {}
    return null;
  }
  function setSession(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function clear() { try { sessionStorage.removeItem(KEY); } catch (e) {} }
  function signOut() { clear(); location.href = 'index.html'; }
  function call(body, cb) {
    if (!api() || !window.fetch) { cb({ ok: false, error: 'not_configured' }); return; }
    fetch(api(), { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) { cb(j || { ok: false, error: 'network' }); })
      .catch(function () { cb({ ok: false, error: 'network' }); });
  }
  function login(grade, name, password, cb) {
    call({ action: 'login', grade: grade, name: name, password: password }, function (r) {
      if (r.ok) setSession({ token: r.token, name: r.name, role: r.role, grade: r.grade, exp: r.exp, tests: r.tests || [] });
      cb(r);
    });
  }
  function refreshTests(cb) {
    var s = session();
    if (!s) { cb({ ok: false, error: 'signed_out' }); return; }
    call({ action: 'tests', token: s.token }, function (r) {
      if (r.ok) { s.tests = r.tests || []; setSession(s); }
      else if (r.error === 'signed_out') clear();
      cb(r);
    });
  }
  /* Called at the top of every test page: sends visitors who are not signed in (or are in another grade) to the sign-in page. */
  function requireLogin(grade) {
    var s = session();
    if (!s || (s.role === 'student' && String(s.grade) !== String(grade))) { location.replace('index.html'); return null; }
    return s;
  }
  function saveResult(data, cb) {
    var s = session();
    if (!s) { cb({ ok: false, error: 'signed_out' }); return; }
    data.action = 'saveResult'; data.token = s.token;
    call(data, cb);
  }
  return { session: session, login: login, refreshTests: refreshTests, requireLogin: requireLogin, saveResult: saveResult, signOut: signOut };
})();
