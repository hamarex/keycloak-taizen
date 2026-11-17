// 第10章 API 側でのトークン検証 (ハンズオン形式)
DATA.chapters.push({
  no: 10, title: `API 側でのトークン検証`,
  lessons: [
    { id: 'c10-l01', title: `JWT のローカル検証`, pages: [
      { id: 'c10-l01-p01', title: `API を用意して入口を確かめる`,
        html: `<p class="goal">やりたいこと: トークンを検証する小さな API を自分で書き、トークン無しの入口を確かめる。</p><div class="step"><h4>手順 1　作業フォルダを用意して jose を入れる</h4><p>Node.js 20 以上で、ライブラリ <code>jose</code> を入れる。</p><pre>mkdir -p ~/develop/kc-handson/api &amp;&amp; cd ~/develop/kc-handson/api
node -v
npm i jose</pre><div class="check"><b>確認</b><pre class="out">node -v が v20 以上を表示し、npm i jose がエラーなく終わる。</pre></div><div class="read"><b>読み方</b><p><code>v20</code> 以上 → 準備完了。エラーになるときは <code>api</code> フォルダで <code>npm i jose</code> を実行したか、Node.js が古くないか(<code>fetch</code> を使うため 18 以上が必要)を見る。</p></div></div><div class="step"><h4>手順 2　server.js を作って起動する</h4><p><code>~/develop/kc-handson/api/server.js</code> を次の内容で作る(第8章のファイルは上書きする)。</p><pre>// 第10章の API。MODE=jwt(既定)はローカル検証、MODE=introspect は Keycloak に問い合わせる
const http = require('node:http');

const ISSUER = process.env.ISSUER || 'http://localhost:8080/realms/demo';
const AUDIENCE = process.env.AUDIENCE || ''; // 空なら aud を検査しない
const MODE = process.env.MODE || 'jwt';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const OIDC = ISSUER + '/protocol/openid-connect';

// status: 401(認証できない) / 403(権限が足りない)。reason は JSON で返す
class AuthError extends Error {
  constructor(status, reason) { super(reason); this.status = status; this.reason = reason; }
}
function need(ok, reason) { if (!ok) throw new AuthError(403, reason); }

let jose, jwks;
// JWT をローカル検証する: JWKS で署名、iss、(あれば)aud、exp を確かめる
async function verifyJwt(token) {
  if (!jose) {
    jose = await import('jose');
    jwks = jose.createRemoteJWKSet(new URL(OIDC + '/certs'));
  }
  try {
    const options = { issuer: ISSUER };
    if (AUDIENCE) options.audience = AUDIENCE;
    return (await jose.jwtVerify(token, jwks, options)).payload;
  } catch (e) {
    throw new AuthError(401, e.code + ': ' + e.message);
  }
}

// Keycloak の Introspection に問い合わせる(呼ぶ側は Confidential client として認証)
async function introspect(token) {
  const basic = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
  const res = await fetch(OIDC + '/token/introspect', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: 'Basic ' + basic },
    body: new URLSearchParams({ token }),
  });
  if (!res.ok) throw new AuthError(401, 'introspection request failed: HTTP ' + res.status);
  const claims = await res.json();
  if (!claims.active) throw new AuthError(401, 'token is not active');
  if (AUDIENCE &amp;&amp; ![].concat(claims.aud || []).includes(AUDIENCE)) {
    throw new AuthError(401, 'unexpected aud: ' + JSON.stringify(claims.aud));
  }
  return claims;
}

const roles = (c) =&gt; (c.realm_access &amp;&amp; c.realm_access.roles) || [];
const scopes = (c) =&gt; String(c.scope || '').split(' ');

const routes = {
  '/public': () =&gt; ({ message: 'public: no token needed' }),
  '/me': (c) =&gt; ({ sub: c.sub, preferred_username: c.preferred_username, aud: c.aud, scope: c.scope }),
  '/admin': (c) =&gt; { need(roles(c).includes('admin'), 'missing realm role: admin'); return { message: 'admin ok' }; },
  '/orders': (c) =&gt; { need(scopes(c).includes('orders:read'), 'missing scope: orders:read'); return { orders: [1, 2, 3] }; },
};

http.createServer(async (req, res) =&gt; {
  const path = new URL(req.url, 'http://localhost').pathname;
  const send = (status, body) =&gt; { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (!routes[path]) return send(404, { error: 'not found' });
  try {
    let claims = {};
    if (path !== '/public') {
      const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
      if (!m) throw new AuthError(401, 'missing bearer token');
      claims = MODE === 'introspect' ? await introspect(m[1]) : await verifyJwt(m[1]);
    }
    send(200, routes[path](claims));
  } catch (e) {
    if (e instanceof AuthError) send(e.status, { error: e.status === 401 ? 'unauthorized' : 'forbidden', reason: e.reason });
    else send(500, { error: 'server error', reason: String(e) });
  }
}).listen(4000, () =&gt; console.log('api listening on :4000 mode=' + MODE + ' aud=' + (AUDIENCE || '(not checked)')));</pre><p>Keycloak を起動し、API を起動する(このターミナルは起動したままにする)。</p><pre>cd ~/develop/kc-handson
docker compose up -d
cd api
node server.js</pre><div class="check"><b>確認</b><pre class="out">api listening on :4000 mode=jwt aud=(not checked)</pre></div><div class="read"><b>読み方</b><p>この表示 → 起動成功。設定(<code>ISSUER</code>・<code>AUDIENCE</code>・<code>MODE</code>・<code>CLIENT_ID</code>・<code>CLIENT_SECRET</code>)は環境変数で渡すので、検証方式を変えるときは API を止めて環境変数を変えて起動し直す。</p></div></div><div class="step"><h4>手順 3　トークン無しで呼ぶ</h4><p>別のターミナルで、認証不要の <code>/public</code> と、トークン無しの <code>/me</code> を呼ぶ。</p><pre>curl -s -i http://localhost:4000/public
curl -s -i http://localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 200 OK
...
{"message":"public: no token needed"}
HTTP/1.1 401 Unauthorized
...
{"error":"unauthorized","reason":"missing bearer token"}</pre></div><div class="read"><b>読み方</b><ul><li><code>/public</code> が 200、<code>/me</code> が 401 → API は保護されたパスだけトークンを要求している。</li><li>401 と 403 の使い分け → 401 は認証できない(トークンが無い・壊れている・期限切れ等)、403 は認証はできたが権限が足りない。コードは前者を <code>AuthError(401, ...)</code>、後者を <code>AuthError(403, ...)</code> で投げ、理由を JSON の <code>reason</code> に入れている。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c10-l01-p02', title: `トークンを取って jwt モードで /me を通す`,
        html: `<p class="goal">やりたいこと: Keycloak に毎回問い合わせず公開鍵 (JWKS) で署名を確かめる JWT のローカル検証で、/me を 200 にする。</p><div class="step"><h4>手順 1　クライアントを用意する</h4><p>管理コンソール(http://localhost:8080 、<code>admin</code> / <code>admin</code>)で realm <code>demo</code> を選ぶ。Clients に <code>frontend-spa</code> が無ければ作る(Client type=<code>OpenID Connect</code>、Client authentication=OFF、Standard flow=ON、Valid redirect URIs=<code>http://localhost:3000/*</code>、Web origins=<code>http://localhost:3000</code>)。<code>frontend-spa</code> の Settings → Capability config で Direct access grants を ON にして Save(学習用の Password Grant。本番では使わない)。Clients → Create client で Client ID=<code>api-service</code>(Client authentication=ON、フローはすべて OFF。第2レッスンの introspection でも使う)を作る。</p><div class="check"><b>確認</b><pre class="out">Clients 一覧に frontend-spa と api-service が並ぶ。</pre></div><div class="read"><b>読み方</b><p>両方ある → 準備完了。</p></div></div><div class="step"><h4>手順 2　Audience Mapper を追加する</h4><p><code>frontend-spa</code> → Client scopes タブ → <code>frontend-spa-dedicated</code> → Configure a new mapper(または Add mapper → By configuration)→ Audience。Name=<code>aud-api-service</code>、Included Client Audience=<code>api-service</code>、Add to access token=ON → Save。</p><div class="check"><b>確認</b><pre class="out">frontend-spa-dedicated の Mappers に aud-api-service が出る。</pre></div><div class="read"><b>読み方</b><p>Mapper が並ぶ → 次に取るトークンの <code>aud</code> に <code>api-service</code> が入る設定になった(既存のトークンは変わらない)。</p></div></div><div class="step"><h4>手順 3　補助関数を定義して API を audience 検査で起動し直す</h4><p>ターミナルに、トークン取得と JWT 表示の補助関数を定義する(この章の以降のページでも使う)。</p><pre>get_token() { curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password \\
  -d username=$1 -d password=$2 -d scope="openid $3" | jq -r .access_token; }
jwtd() { cut -d. -f2 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .; }
call() { curl -s -w '  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $TOKEN" http://localhost:4000$1; }</pre><p>API を止め(Ctrl+C)、audience を検査する設定で起動し直す。</p><pre>cd ~/develop/kc-handson/api
AUDIENCE=api-service node server.js</pre><div class="check"><b>確認</b><pre class="out">api listening on :4000 mode=jwt aud=api-service</pre></div><div class="read"><b>読み方</b><p><code>aud=api-service</code> → <code>aud</code> を検査するモードで動いている。</p></div></div><div class="step"><h4>手順 4　alice のトークンで /me を呼ぶ</h4><p>別のターミナルで alice のトークンを取り、中身を見て API を呼ぶ。</p><pre>TOKEN=$(get_token alice alice)
echo $TOKEN | jwtd | jq '{iss, aud, azp, exp, preferred_username}'
call /me</pre><div class="check"><b>確認</b><pre class="out">{
  "iss": "http://localhost:8080/realms/demo",
  "aud": [ "api-service", "account" ],
  "azp": "frontend-spa",
  "exp": 1760000300,
  "preferred_username": "alice"
}
{"sub":"...","preferred_username":"alice","aud":["api-service","account"],"scope":"openid email profile"}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><ul><li><code>aud</code> に <code>api-service</code> が入り <code>/me</code> が 200 → 署名・iss・aud・exp の検証をすべて通った。</li><li>401 で <code>aud</code> に <code>api-service</code> が無い → Audience Mapper の設定漏れ。Add to access token が OFF でないか、トークンを取り直したか(古いトークンは変わらない)を確認する。</li><li><code>iss</code> が API の <code>ISSUER</code> と食い違って拒否される → <code>iss</code> は完全一致が必要。ブラウザや curl では必ず <code>localhost</code> を使う(<code>127.0.0.1</code> で取ると <code>iss</code> が変わる)。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c10-l01-p03', title: `署名・aud・別 realm のトークンで 401 の理由を見る`,
        html: `<p class="goal">やりたいこと: 検証のどの項目で落ちるとどんな理由が返るかを、わざと壊して見る。</p><div class="step"><h4>手順 1　署名を壊す</h4><p>前ページの補助関数が定義済みで、API が <code>AUDIENCE=api-service</code> で起動している前提。署名部分(最後のブロック)の先頭 1 文字を別の文字に置き換えて呼ぶ。</p><pre>TOKEN=$(get_token alice alice)
call /me
BAD=$(echo $TOKEN | awk -F. '{ c = (substr($3,1,1) == "A") ? "B" : "A"; print $1 "." $2 "." c substr($3,2) }')
curl -s -w '  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $BAD" http://localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"ERR_JWS_SIGNATURE_VERIFICATION_FAILED: signature verification failed"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><p>署名エラー → payload が改ざんされた、または別の鍵で署名された。トークンは中身を読めても書き換えられない(エラー名は jose のもので、細かい文言はバージョンで変わりうる)。</p></div></div><div class="step"><h4>手順 2　aud を食い違わせる</h4><p>API を止め、期待する audience を別の名前にして起動し直し、同じ(正しい)トークンで呼ぶ。</p><pre>cd ~/develop/kc-handson/api
AUDIENCE=other-api node server.js</pre><pre>call /me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"aud\\" claim value"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><p><code>aud</code> のエラー → 署名は正しいが、このトークンはこの API 宛てではない。トークンの <code>aud</code> と API の <code>AUDIENCE</code> を見比べる。確認後は API を <code>AUDIENCE=api-service node server.js</code> に戻して起動し直す。</p></div></div><div class="step"><h4>手順 3　別 realm のトークンを使う</h4><p>issuer も署名鍵も違う、master realm の管理者トークンを取って呼ぶ。</p><pre>MTOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \\
  -d client_id=admin-cli -d grant_type=password -d username=admin -d password=admin | jq -r .access_token)
echo $MTOKEN | jwtd | jq .iss
curl -s -w '  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $MTOKEN" http://localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">"http://localhost:8080/realms/master"
{"error":"unauthorized","reason":"ERR_JWKS_NO_MATCHING_KEY: no applicable key found in the JSON Web Key Set"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><ul><li><code>iss</code> が master で 401 → 正しい署名でも、信頼する発行元(realm)が違えば通らない。</li><li><code>ERR_JWKS_NO_MATCHING_KEY</code> → <code>kid</code> が demo realm の JWKS に無く鍵が見つからない。鍵が見つかった場合でも <code>iss</code> が違うので <code>unexpected "iss" claim value</code> で落ちる。</li><li>どの失敗も 401 で返す → このコードの方針。<code>aud</code> 違いを 403 で返す実装もある。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c10-l01-p04', title: `期限切れのトークンで 401 を見る`,
        html: `<p class="goal">やりたいこと: ローカル検証では exp (有効期限) を API 自身が時計で判定することを、Access Token の寿命を短くして確かめる。</p><div class="step"><h4>手順 1　寿命を 1 分にしてトークンを取る</h4><p>管理コンソールで Realm settings → Tokens タブ → Access Token Lifespan を <code>1 minutes</code> にして Save(通常は 5 分)。トークンを取って、すぐ呼ぶ。</p><pre>TOKEN=$(get_token alice alice)
echo $TOKEN | jwtd | jq '.exp - .iat'
call /me</pre><div class="check"><b>確認</b><pre class="out">60
{"sub":"...", ...}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><ul><li><code>exp - iat</code> が 60 → 寿命の設定がトークンに反映された(変更は新しいトークンから)。</li><li><code>/me</code> が 200 → 期限内なので通る。</li></ul></div></div><div class="step"><h4>手順 2　期限後に同じトークンで呼ぶ</h4><p>2 分ほど待ってから、同じトークンでもう一度呼ぶ。終わったら Access Token Lifespan を元の <code>5 minutes</code> に戻して Save する。</p><pre>sleep 120
call /me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"ERR_JWT_EXPIRED: \\"exp\\" claim timestamp check failed"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><ul><li>同じトークンが 1 回目は 200、2 分後は 401 → API が <code>exp</code> を自分の時計で見て拒否している。Keycloak に問い合わせなくても分かる。</li><li>API を動かすマシンと Keycloak の時刻がずれている → 期限切れの判定もずれることがある。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c10-l01-p05', title: `401 と 403: ロールと scope で認可を試す`,
        html: `<p class="goal">やりたいこと: 署名が正しくても、権限 (ロール・scope) が足りなければ API は 403 で拒否することを、/admin と /orders で確かめて直す。</p><div class="step"><h4>手順 1　ロールが無い人で 403 を見る</h4><p>admin ロールを持たない bob と、第1章で <code>admin</code> を付けてある alice で <code>/admin</code> を呼ぶ。</p><pre>TOKEN=$(get_token bob bob)
call /admin
TOKEN=$(get_token alice alice)
call /admin</pre><div class="check"><b>確認</b><pre class="out">(bob)    {"error":"forbidden","reason":"missing realm role: admin"}  -&gt; HTTP 403
(alice)  {"message":"admin ok"}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>署名が通るのに bob は 403 → 誰かは分かったがこの操作を許可されていない。401(トークンを取り直す・設定を直す)とは直し方が違い、403 はロール/scope を与える。</p></div></div><div class="step"><h4>手順 2　bob に admin を付けて 200 にする</h4><p>管理コンソール Users → <code>bob</code> → Role mapping タブ → Assign role で <code>admin</code> を付ける(Realm roles に無ければ第1章に戻って作る)。トークンを取り直して呼ぶ。</p><pre>TOKEN=$(get_token bob bob)
echo $TOKEN | jwtd | jq .realm_access
call /admin</pre><div class="check"><b>確認</b><pre class="out">{ "roles": [ "default-roles-demo", "admin", ... ] }
{"message":"admin ok"}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><ul><li><code>realm_access</code> に <code>admin</code> が入り 200 → ロール付与が効いた。</li><li>付けた直後でも 403 のまま → 古いトークンを使っているだけ(ロールはトークン発行時に載る)。</li><li>確認後は、後の章が bob に admin が無い前提なので、Users → <code>bob</code> → Role mapping で <code>admin</code> を選んで Unassign する。</li></ul></div></div><div class="step"><h4>手順 3　scope を要求して /orders を通す</h4><p>scope <code>orders:read</code> が第4章で作成され <code>frontend-spa</code> に Optional で割り当て済みか確かめる(無ければ Client scopes → Create client scope で Name=<code>orders:read</code>、Type=<code>None</code>、Protocol=OpenID Connect、Include in token scope=ON → Save し、<code>frontend-spa</code> に Optional で追加する)。まず scope 無しで呼び、次に要求して呼ぶ。</p><pre>TOKEN=$(get_token alice alice)
call /orders
TOKEN=$(get_token alice alice orders:read)
echo $TOKEN | jwtd | jq .scope
call /orders</pre><div class="check"><b>確認</b><pre class="out">{"error":"forbidden","reason":"missing scope: orders:read"}  -&gt; HTTP 403
"openid orders:read email profile"
{"orders":[1,2,3]}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><ul><li>scope 無しは 403、要求後は 200 → <code>/orders</code> は scope <code>orders:read</code> を見ている(並び順は環境で変わりうる)。</li><li><code>scope</code> に <code>orders:read</code> が出ない → Optional Scope は要求しないと載らない。<code>scope=</code> に書いたか、Client scopes タブで Optional として割り当てたかを確認する。</li><li>API の判断材料 → ロールは <code>realm_access.roles</code>、scope は <code>scope</code> claim(スペース区切り)。どこを見るかは API 側の実装で決まる。</li></ul></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c10-l02', title: `Introspection・Userinfo・比較・実装例`, pages: [
      { id: 'c10-l02-p01', title: `introspect モードに切り替える`,
        html: `<p class="goal">やりたいこと: API が Keycloak の Introspection エンドポイントに毎回問い合わせて、トークンが今も有効かを決める方式を試す。</p><div class="step"><h4>手順 1　Introspection を curl で直接呼ぶ</h4><p>Clients → <code>api-service</code> → Credentials タブで Client secret をコピーして変数に入れ、api-service として認証して Introspection を呼ぶ。</p><pre>API_SECRET='ここに貼る'
TOKEN=$(get_token alice alice)
curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token/introspect \\
  -u api-service:$API_SECRET -d token=$TOKEN | jq '{active, sub, aud, scope, preferred_username}'</pre><div class="check"><b>確認</b><pre class="out">{"active":true,"sub":"...","aud":["api-service","account"],"scope":"openid email profile","preferred_username":"alice"}</pre></div><div class="read"><b>読み方</b><ul><li><code>"active": true</code> → Keycloak がこのトークンを有効と答えた。</li><li><code>sub</code>・<code>scope</code>・<code>aud</code> がトークンを自分でデコードした内容と同じ → Introspection はトークンの claim を返している。</li></ul></div></div><div class="step"><h4>手順 2　API を introspect モードで起動して呼ぶ</h4><p>API を止め、introspect モードで起動し直して、別のターミナルで呼ぶ。</p><pre>cd ~/develop/kc-handson/api
MODE=introspect CLIENT_ID=api-service CLIENT_SECRET=$API_SECRET AUDIENCE=api-service node server.js</pre><pre>call /me</pre><div class="check"><b>確認</b><pre class="out">{"sub":"...","preferred_username":"alice", ...}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>200 → Keycloak が有効と答え、API がそれを信じた。API のコードはこの応答の <code>aud</code> や <code>realm_access</code> を見て判断している。</p></div></div><div class="step"><h4>手順 3　secret を間違えて起動する</h4><p>わざと <code>CLIENT_SECRET=wrong</code> で起動し直し、もう一度呼ぶ。確認後、正しい secret で起動し直す。</p><pre>call /me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"introspection request failed: HTTP 401"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><p>secret が違うと Introspection 自体が 401 → API は通さない。ローカル検証と違い、API 自身が Confidential client の資格を持つ必要がある。</p></div></div>`,
        oxIds: [] },
      { id: 'c10-l02-p02', title: `失効の反映の違いを比べる`,
        html: `<p class="goal">やりたいこと: ローカル検証と Introspection で、Sign out 後のトークンの扱いがどう違うかを同じトークンで比べる。</p><div class="step"><h4>手順 1　jwt モードで Sign out 後も通ることを見る</h4><p>API を jwt モード(<code>AUDIENCE=api-service node server.js</code>)で起動し直し、新しいトークンで 200 を確認する。次に管理コンソール Users → <code>alice</code> → Sessions タブで、ログイン中のセッションを Sign out してから、同じトークンで呼ぶ。</p><pre>TOKEN=$(get_token alice alice)
call /me</pre><pre>call /me</pre><div class="check"><b>確認</b><pre class="out">(jwt モード、Sign out 後)  {"sub":"...", ...}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>Sign out 後も 200 → 署名と <code>exp</code> だけを見ているので、サーバー側の失効に気づけない。</p></div></div><div class="step"><h4>手順 2　introspect モードで同じトークンを呼ぶ</h4><p>API を introspect モード(前ページの起動コマンド)で起動し直し、同じトークンで呼ぶ。続けて Introspection も curl で直接呼ぶ。</p><pre>call /me
curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token/introspect \\
  -u api-service:$API_SECRET -d token=$TOKEN | jq .</pre><div class="check"><b>確認</b><pre class="out">(introspect モード)        {"error":"unauthorized","reason":"token is not active"}  -&gt; HTTP 401
{ "active": false }</pre></div><div class="read"><b>読み方</b><ul><li>API は 401、Introspection は <code>active: false</code> → Keycloak がセッション終了を把握していて、即座に無効と答える。</li><li>使い分け → 失効の即時反映が必要なら Introspection、性能を優先して Access Token を短命にするならローカル検証。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c10-l02-p03', title: `Userinfo と、方式の選び方・実装例`,
        html: `<p class="goal">やりたいこと: Discovery・JWKS・Userinfo エンドポイントを触り、API 側の検証方式の選び方を整理する。</p><div class="step"><h4>手順 1　Discovery と JWKS を見る</h4><p>Discovery から JWKS・Userinfo・Introspection の URL を確認し、JWKS(ローカル検証で API が取りに行く公開鍵)を見る。</p><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{jwks_uri, userinfo_endpoint, introspection_endpoint}'
curl -s http://localhost:8080/realms/demo/protocol/openid-connect/certs | jq '.keys[] | {kid, alg, use}'</pre><div class="check"><b>確認</b><pre class="out">{ "jwks_uri": ".../certs", "userinfo_endpoint": ".../userinfo", "introspection_endpoint": ".../token/introspect" }
{ "kid": "...", "alg": "RSA-OAEP", "use": "enc" }
{ "kid": "...", "alg": "RS256", "use": "sig" }</pre></div><div class="read"><b>読み方</b><p>3 つの URL と鍵の一覧 → 署名検証に使うのは <code>use</code> が <code>sig</code>(<code>RS256</code>)の鍵。API は <code>jwks_uri</code> から取った鍵で検証する。</p></div></div><div class="step"><h4>手順 2　トークンの kid と JWKS を対応させる</h4><p>トークンのヘッダ(1 ブロック目)をデコードして <code>kid</code> を見る。</p><pre>TOKEN=$(get_token alice alice)
echo $TOKEN | cut -d. -f1 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .</pre><div class="check"><b>確認</b><pre class="out">{ "alg": "RS256", "typ": "JWT", "kid": "..." }</pre></div><div class="read"><b>読み方</b><ul><li>ヘッダの <code>kid</code> が JWKS のどれかと一致 → API は kid で公開鍵を選んで署名検証できる。</li><li>一致しない(鍵ローテーション直後など) → API は JWKS を取り直す必要がある(第14章で実際に回す)。</li></ul></div></div><div class="step"><h4>手順 3　Userinfo を呼ぶ</h4><p>同じトークンで Userinfo を呼ぶ。</p><pre>curl -s http://localhost:8080/realms/demo/protocol/openid-connect/userinfo -H "Authorization: Bearer $TOKEN" | jq .</pre><div class="check"><b>確認</b><pre class="out">{ "sub": "...", "preferred_username": "alice", "email": "alice@example.com", ... }</pre></div><div class="read"><b>読み方</b><ul><li>alice のプロフィールが返る → 有効なアクセストークンで本人の情報を Keycloak から取れる(期限切れや失効済みは 401)。Userinfo は「このトークンを通すか」の判定が主目的ではない。</li><li>方式の選び方 → ローカル検証は速く Keycloak に依存しないが、失効は <code>exp</code> まで気づけない。Introspection は即時反映だが通信が増え、API が Confidential client になる。多くの API はローカル検証を基本にし、重要な操作だけ Introspection を併用する。</li><li>実装例 → 自作 <code>server.js</code> の <code>verifyJwt</code>(jose の <code>createRemoteJWKSet</code> と <code>jwtVerify</code>)と <code>introspect</code> が最小実装。Spring Security は <code>issuer-uri</code> の設定で JWKS 取得と <code>iss</code> 検証を自動で行い(<code>aud</code> は別途検証を追加)、Python は PyJWT の <code>PyJWKClient</code>、Go は <code>go-oidc</code> を使う。</li></ul></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
