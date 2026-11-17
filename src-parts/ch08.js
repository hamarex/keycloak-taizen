// 第8章 ハンズオン形式
DATA.chapters.push({
  no: 8, title: `トークンの書式と Authorization Code Flow`,
  lessons: [
    { id: 'c08-l01', title: `JWT / JWS / JWE`, pages: [
      { id: 'c08-l01-p01', title: `JWT を header / payload / signature に分け、署名の正体を見る`,
        html: `<p class="goal">やりたいこと: JWT は「署名付きの書類」で、<code>header.payload.signature</code> の3つを Base64URL でつないだ文字列。Keycloak の Access / ID Token は署名付き JWT (JWS) 形式。署名がどんなもので、何を守っているかを手で確かめる。</p><div class="step"><h4>手順 1　header と署名を読む</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> で <code>get_token</code> が使える。</p><pre>T=$(get_token alice)
AT=$(echo $T | jq -r .access_token)
jwth $AT</pre><p>署名 (3つ目) のバイト数を数える。</p><pre>echo $AT | cut -d. -f3 | tr '_-' '/+' | awk '{while(length($0)%4)$0=$0"=";print}' | base64 -d | wc -c</pre><div class="check"><b>確認</b><pre class="out">{ "alg": "RS256", "typ": "JWT", "kid": "…" }
256</pre></div><div class="read"><b>読み方</b><p>header に <code>alg</code> と <code>kid</code> が出て、署名のバイト数が出る。</p><p><code>alg: RS256</code> と <code>kid</code> は、RSA 秘密鍵で署名し、どの鍵かを kid で示している。署名は 256 バイト (2048bit RSA) のバイナリ。</p></div></div><div class="step"><h4>手順 2　Refresh Token と ID Token の header を比べる</h4><pre>jwth $(echo $T | jq -r .refresh_token) | jq -c '{alg, typ}'
jwth $(echo $T | jq -r .id_token) | jq -c '{alg, typ}'</pre><div class="check"><b>確認</b><pre class="out">{"alg":"HS512","typ":"JWT"}
{"alg":"RS256","typ":"JWT"}</pre></div><div class="read"><b>読み方</b><p>Refresh Token は <code>HS512</code>、ID Token は <code>RS256</code>。</p><p>Refresh Token の宛先は Keycloak なので、検証できるのは Keycloak だけ。API が Access Token のように公開鍵で検証するものではない。</p></div></div><div class="step"><h4>手順 3　署名の1文字を書き換えて userinfo を呼ぶ</h4><pre>BAD="\${AT%?}A"
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $AT" $OIDC/userinfo
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $BAD" $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">200
401</pre></div><div class="read"><b>読み方</b><p>元のトークンは 200、書き換えたトークンは 401。</p><p>署名は header と payload の両方に対して計算されている。payload は誰でも読める (暗号化ではない) ので秘密情報を claim に入れてはいけないが、書き換えれば見破られる。</p><ul><li><code>BAD</code> でも 200 → 署名の末尾の文字は下位4ビットがバイト列に使われないため、元の文字によっては <code>A</code> に替えても署名の中身が変わらない (4回に1回ほど起きる)。もう一度トークンを取り直して試す。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c08-l01-p02', title: `JWE (暗号化) ではないことを確かめる`,
        html: `<p class="goal">やりたいこと: JWT の暗号化版が JWE (5分割)。Keycloak は通常、署名のみ (JWS・3分割) で中身は暗号化されない。「中身が読める」ことと「改ざんできない」ことが別であることを整理する。</p><div class="step"><h4>手順 1　ドットの数と payload を見る</h4><pre>AT=$(get_token alice | jq -r .access_token)
echo -n $AT | tr -cd . | wc -c
jwt $AT | jq -c '{preferred_username, email}'</pre><div class="check"><b>確認</b><pre class="out">2
{"preferred_username":"alice","email":"alice@example.com"}</pre></div><div class="read"><b>読み方</b><p>ドットの数と、鍵なしで読めた payload が出る。</p><p>ドットが 2 個なら3分割の JWS。5分割 (ドット4個) なら JWE で、鍵なしでは中身が読めない。鍵なしで payload が読めたので、署名は「改ざん防止」、暗号化は別の機能。</p></div></div><div class="step"><h4>手順 2　payload を書き換えた偽物を通す</h4><p>署名はそのままにして payload の alice を mallory に書き換え、userinfo に通す (下のコマンドで行う)。</p><pre>P=$(echo $AT | cut -d. -f2 | tr '_-' '/+' | awk '{while(length($0)%4)$0=$0"=";print}' | base64 -d | sed 's/alice/mallory/' | base64 | tr '+/' '-_' | tr -d '=\\n')
FAKE="$(echo $AT | cut -d. -f1).$P.$(echo $AT | cut -d. -f3)"
jwt $FAKE | jq -r .preferred_username
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $FAKE" $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">mallory
401</pre></div><div class="read"><b>読み方</b><p>偽物の中身は <code>mallory</code> と読めるが、userinfo は 401。</p><p>読めることと信用できることは別で、検証側は署名で信用を決める。中身を隠したい場合は JWE (Keycloak では Client の設定で有効化できるが通常は使わない) か、claim に秘密情報を入れない設計にする。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c08-l02', title: `kid と JWKS`, pages: [
      { id: 'c08-l02-p01', title: `JWKS を取り、トークンの kid と照合する`,
        html: `<p class="goal">やりたいこと: API は Keycloak の公開鍵をどう知るのか。答えは JWKS (公開鍵の一覧) と kid (鍵の ID)。トークンの header の kid が、JWKS のどの鍵に当たるかを自分で照合する。</p><div class="step"><h4>手順 1　JWKS の鍵を一覧する</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。</p><pre>curl -s $OIDC/certs | jq '.keys[] | {kid, kty, alg, use}'</pre><div class="check"><b>確認</b><pre class="out">{ "kid": "AbC…", "kty": "RSA", "alg": "RS256", "use": "sig" }
{ "kid": "XyZ…", "kty": "RSA", "alg": "RSA-OAEP", "use": "enc" }</pre></div><div class="read"><b>読み方</b><p>鍵が <code>sig</code> と <code>enc</code> で並ぶ。</p><p><code>use: sig</code> が署名検証用、<code>enc</code> は暗号化用。検証に使うのは <code>sig</code>。JWKS が認証なしで取れるのは公開鍵だから問題ない (秘密鍵は Keycloak の中だけ)。API はこれを取得してキャッシュする。</p></div></div><div class="step"><h4>手順 2　トークンの kid に合う鍵を探す</h4><pre>AT=$(get_token alice | jq -r .access_token)
KID=$(jwth $AT | jq -r .kid); echo $KID
curl -s $OIDC/certs | jq --arg k $KID '.keys[] | select(.kid == $k) | {kid, alg, use, e, n: (.n[0:30] + "...")}'</pre><div class="check"><b>確認</b><pre class="out">(トークンの kid) AbC…
{ "kid": "AbC…", "alg": "RS256", "use": "sig", "e": "AQAB", "n": "0vx7agoebGcQSuuPiLJXZp…..." }</pre></div><div class="read"><b>読み方</b><p>トークンの kid と、同じ kid の鍵が出る。</p><p>一致する鍵があれば、API はこの鍵で署名を検証する。<code>n</code> と <code>e</code> が RSA 公開鍵の本体。kid に合う鍵が JWKS に無いなら、鍵ローテーション後に古い鍵を失効した、または別の realm のトークン (次ページ)。</p></div></div><div class="step"><h4>手順 3　管理コンソールで同じ kid を探す</h4><p>管理コンソール「Realm settings」→「Keys」タブの Keys list で、同じ kid を探す。</p><div class="check"><b>確認</b><pre class="out">Keys list に同じ kid がある。</pre></div><div class="read"><b>読み方</b><p>鍵の実体を管理する場所は Realm settings → Keys。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l02-p02', title: `鍵ローテーション: 新しい鍵が増えても古いトークンは検証できる`,
        html: `<p class="goal">やりたいこと: 署名鍵は定期的に入れ替える (ローテーション)。新しい鍵を追加すると、新しいトークンは新しい kid になり、JWKS には新旧の鍵が並ぶ。API が kid で鍵を選ぶ意味を、実際に鍵を足して確かめる。</p><div class="step"><h4>手順 1　ローテーション前の kid を控える</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。</p><pre>OLD=$(get_token alice | jq -r .access_token)
jwth $OLD | jq -r .kid
curl -s $OIDC/certs | jq -r '.keys[] | select(.use=="sig") | .kid'</pre><div class="check"><b>確認</b><pre class="out">(ローテーション前)  kid = AAA…       JWKS: AAA…</pre></div><div class="read"><b>読み方</b><p>トークンの kid が JWKS の <code>sig</code> 鍵の kid と一致する。</p><p>この時点では鍵が1つで、トークンはそれで署名されている。</p></div></div><div class="step"><h4>手順 2　新しい鍵を追加する</h4><p>管理コンソール「Realm settings」→「Keys」タブ →「Add providers」(または Providers サブタブの「Add provider」) →「rsa-generated」を選ぶ。Name = <code>rsa-new</code>、Priority = <code>200</code> (既定の鍵の優先度より大きい値) を入力して「Save」を押す。</p><pre>NEW=$(get_token alice | jq -r .access_token)
jwth $NEW | jq -r .kid
curl -s $OIDC/certs | jq -r '.keys[] | select(.use=="sig") | .kid'</pre><div class="check"><b>確認</b><pre class="out">(ローテーション後)  kid = BBB…       JWKS: AAA… と BBB…</pre></div><div class="read"><b>読み方</b><p>新しいトークンの kid が変わり、JWKS に2つの <code>sig</code> 鍵が並ぶ。</p><p>署名鍵が切り替わったが、旧鍵も残っている。追加した鍵が優先されないなら Priority が既存より小さいので、大きくする。</p></div></div><div class="step"><h4>手順 3　古いトークンがまだ通るか確かめる</h4><pre>curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $OLD" $OIDC/userinfo
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $NEW" $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">200
200</pre></div><div class="read"><b>読み方</b><p>どちらも 200。</p><p>旧鍵が JWKS に残っている間は、旧鍵で署名したトークンも検証できる。ローテーションで既存ログインを壊さないための仕組み。API が kid で鍵を選ぶので、鍵が複数あってもどれで検証すべきか1つに決まり、JWKS のキャッシュに無い kid が来たら再取得する。確認後、<code>rsa-new</code> は残しても消してもよい (消すと、その鍵で署名したトークンは検証できなくなる)。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c08-l03', title: `Bearer token と Introspection`, pages: [
      { id: 'c08-l03-p01', title: `API (Resource Server) を自作し、Bearer トークンで保護する`,
        html: `<p class="goal">やりたいこと: Bearer token は「持っている人は誰でも使える入場券」で、HTTP ヘッダ <code>Authorization: Bearer ...</code> で API に渡す。トークンを検証するだけの最小の API (<code>api-service</code>) を書き、トークンの有無・正しさで応答が変わるのを確かめる。署名は JWKS で、<code>iss</code> と <code>exp</code> もライブラリが検証する。この API は第10章でさらに検証を足す。</p><div class="step"><h4>手順 1　API を作って起動する</h4><p>前提: Node.js 20 以上。<code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>frontend-spa</code> に <code>orders:read</code> が Optional で割り当て済み (第4章)。alice に Realm Role <code>admin</code> 付与済み (第1章)。</p><p><code>jose</code> をインストールする。</p><pre>cd ~/develop/kc-handson/api
npm init -y
npm i jose@5</pre><p><code>~/develop/kc-handson/api/server.js</code> を次の内容で作る。</p><pre>const http = require('http');
const ISS = process.env.ISSUER || 'http://localhost:8080/realms/demo';   // 信頼する issuer (トークンの iss と完全一致が必要)
const CORS = { 'Access-Control-Allow-Origin': 'http://localhost:3000', 'Access-Control-Allow-Headers': 'authorization' };
const json = (res, code, obj) =&gt; { res.writeHead(code, { 'Content-Type': 'application/json', ...CORS }); res.end(JSON.stringify(obj, null, 2)); };

(async () =&gt; {
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  const jwks = createRemoteJWKSet(new URL(ISS + '/protocol/openid-connect/certs'));  // kid に合う公開鍵を JWKS から選ぶ (キャッシュされる)
  http.createServer(async (req, res) =&gt; {
    const path = new URL(req.url, 'http://localhost:4000').pathname;
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }   // ブラウザの CORS 事前確認
    if (path === '/public') return json(res, 200, { message: 'public: トークン不要' });
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');                  // Bearer トークンを取り出す
    if (!m) return json(res, 401, { error: 'missing_bearer_token' });
    let payload;
    try { ({ payload } = await jwtVerify(m[1], jwks, { issuer: ISS })); }             // 署名 + iss + exp を検証
    catch (e) { return json(res, 401, { error: 'invalid_token', reason: e.code + ': ' + e.message }); }
    const roles = (payload.realm_access &amp;&amp; payload.realm_access.roles) || [];         // Keycloak 独自の claim (第3章)
    const scopes = (payload.scope || '').split(' ');
    if (path === '/me') return json(res, 200, { sub: payload.sub, username: payload.preferred_username, azp: payload.azp, aud: payload.aud });
    if (path === '/admin') return roles.includes('admin') ? json(res, 200, { admin: true }) : json(res, 403, { error: 'role admin required' });
    if (path === '/orders') return scopes.includes('orders:read') ? json(res, 200, { orders: [1, 2, 3] }) : json(res, 403, { error: 'scope orders:read required' });
    json(res, 404, { error: 'not found' });
  }).listen(4000, () =&gt; console.log('api on http://localhost:4000  issuer=' + ISS));
})();</pre><p>別のターミナルで起動する。</p><pre>cd ~/develop/kc-handson/api
node server.js</pre><div class="check"><b>確認</b><pre class="out">api on http://localhost:4000  issuer=http://localhost:8080/realms/demo</pre></div><div class="read"><b>読み方</b><p>起動したターミナルにメッセージが出る。</p><p>出ていれば API は待ち受けている。<code>ECONNREFUSED</code> や JWKS 取得失敗の 401 は Keycloak に接続できない状態なので、<code>ISSUER</code> 環境変数や起動状態を確認する。</p></div></div><div class="step"><h4>手順 2　いろいろな形でトークンを送る</h4><pre>AT=$(get_token alice | jq -r .access_token)
curl -s localhost:4000/public
curl -s -o /dev/null -w '%{http_code}\\n' localhost:4000/me
curl -s -H "Authorization: Bearer $AT" localhost:4000/me
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Basic $AT" localhost:4000/me
curl -s -o /dev/null -w '%{http_code}\\n' "localhost:4000/me?access_token=$AT"</pre><div class="check"><b>確認</b><pre class="out">{ "message": "public: トークン不要" }
401
{ "sub": "…", "username": "alice", "azp": "frontend-spa", "aud": ["api-service","account"] }
401
401</pre></div><div class="read"><b>読み方</b><p>応答が次の順に出る (いずれの応答も、実際は2スペースで整形された複数行で出る)。</p><p>トークンなしは 401、Bearer 付きは 200 で、API は Bearer を検証して中身を返す。<code>/public</code> は不要。<code>Basic</code> 形式や URL のクエリ文字列で渡すと 401 になる。Bearer はヘッダで渡し、クエリ文字列に入れるとログに残るので避ける。盗まれたら使われるので、HTTPS 必須・寿命を短く・URL やログに出さない。</p></div></div><div class="step"><h4>手順 3　ロールと scope で 403 / 200 を確かめる</h4><pre>curl -s -o /dev/null -w 'alice /admin: %{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/admin
BT=$(get_token bob | jq -r .access_token)
curl -s -o /dev/null -w 'bob   /admin: %{http_code}\\n' -H "Authorization: Bearer $BT" localhost:4000/admin
curl -s -o /dev/null -w 'no scope /orders: %{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/orders
OT=$(get_token alice orders:read | jq -r .access_token)
curl -s -o /dev/null -w 'orders:read /orders: %{http_code}\\n' -H "Authorization: Bearer $OT" localhost:4000/orders</pre><div class="check"><b>確認</b><pre class="out">alice /admin: 200
bob   /admin: 403
no scope /orders: 403
orders:read /orders: 200</pre></div><div class="read"><b>読み方</b><p>4行が出る。</p><p><b>401 = 誰か分からない / 検証失敗、403 = 誰かは分かったが権限不足</b>。<code>/admin</code> はロール (<code>realm_access.roles</code>) で、<code>/orders</code> は scope の有無で 403 → 200 になる (スコープも認可に使える。第4章 l01 p05)。</p></div></div><div class="step"><h4>手順 4　issuer が合わない場合を試す</h4><p>第1章で <code>KC_HOSTNAME</code> を固定しているので、127.0.0.1 経由で取ったトークンも <code>iss</code> は <code>localhost</code> のままになり、API は通してしまう。そこで API 側の issuer を 127.0.0.1 にして起動し直す (API のターミナルで Ctrl+C してから)。</p><pre>cd ~/develop/kc-handson/api
ISSUER=http://127.0.0.1:8080/realms/demo node server.js</pre><p>別のターミナルで、いつもどおり localhost で取ったトークンを渡す。</p><pre>AT=$(get_token alice | jq -r .access_token)
curl -s -H "Authorization: Bearer $AT" localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">{ "error": "invalid_token", "reason": "ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"iss\\" claim value" }</pre></div><div class="read"><b>読み方</b><p><code>iss</code> の検証失敗が返る (整形された複数行で出る)。</p><p>トークンの <code>iss</code> (localhost) と API に設定した issuer (127.0.0.1) が違う。API は設定した issuer と完全一致を要求する (第2章 l02 p03)。KC_HOSTNAME を固定していない環境では、127.0.0.1 で取ったトークンを渡すだけで同じ症状になる。確認したら、API を Ctrl+C で止め、<code>ISSUER</code> なしで起動し直しておく (次ページ以降が通らなくなるため)。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l03-p02', title: `Introspection: ログアウト後も JWT のローカル検証は通ってしまう`,
        html: `<p class="goal">やりたいこと: JWT のローカル検証は速いが、<code>exp</code> までは署名だけで有効に見える。ログアウトや失効を即時に反映したいときは Introspection (Keycloak に「今も有効か」を問い合わせる)。同じトークンで両者の違いを見る。</p><div class="step"><h4>手順 1　サインアウト前に両方で確認する</h4><p>前提: API (第8章 l03 p01 で作った <code>~/develop/kc-handson/api/server.js</code> を <code>cd ~/develop/kc-handson/api &amp;&amp; node server.js</code> で起動している) が <code>:4000</code> で動いている。<code>api-service</code> と <code>$API_SECRET</code> が用意済み。</p><pre>AT=$(get_token alice | jq -r .access_token)
curl -s -o /dev/null -w 'api(local): %{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/me
curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq -c '{active, username}'</pre><div class="check"><b>確認</b><pre class="out">(サインアウト前)
api(local): 200
{"active":true,"username":"alice"}</pre></div><div class="read"><b>読み方</b><p>API が 200、introspection が <code>active: true</code>。</p><p>どちらも有効と判定している。最初から <code>active: false</code> なら <code>$API_SECRET</code> が違う、またはトークンが期限切れ。</p></div></div><div class="step"><h4>手順 2　サインアウトして同じトークンで確認する</h4><p>管理コンソールの「Sessions」で、alice の行 (Clients 列に <code>frontend-spa</code>) の右端のメニューから「Sign out」を実行する。</p><pre>curl -s -o /dev/null -w 'api(local): %{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/me
curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq -c '{active}'
curl -s -o /dev/null -w 'userinfo: %{http_code}\\n' -H "Authorization: Bearer $AT" $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">(サインアウト後)
api(local): 200
{"active":false}
userinfo: 401</pre></div><div class="read"><b>読み方</b><p>API は 200 のまま、introspection は <code>false</code>、userinfo は 401。</p><p>署名と <code>exp</code> だけを見る自作 API は、ログアウトした後も期限 (最大5分) まで通してしまう。introspection は即時に <code>false</code> で、Keycloak がセッションの状態まで見ているが、毎回通信が必要で Keycloak に負荷がかかる。速度・負荷を優先するならローカル検証 + 短い寿命、失効の即時反映が必須なら introspection (第10章で API に足す)。introspection に呼び出し側のクライアント認証が必要なのは、他人のトークンを誰でも調べられないようにするため (<code>api-service</code> は Confidential)。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c08-l04', title: `1回のログインから API 呼び出しまで`, pages: [
      { id: 'c08-l04-p01', title: `SPA から Bearer で API を呼ぶ`,
        html: `<p class="goal">やりたいこと: ログインで得た Access Token を使って、SPA が API (<code>:4000</code>) を呼ぶところまでを1つのアプリでつなぐ。第7章の SPA に API を呼ぶボタンを足す (差分だけ)。</p><div class="step"><h4>手順 1　ボタンと関数を足す</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) と API (第8章 l03 p01 で作った <code>~/develop/kc-handson/api/server.js</code> を <code>cd ~/develop/kc-handson/api &amp;&amp; node server.js</code> で起動している) が <code>:3000</code> / <code>:4000</code> で動いている。API の CORS は <code>http://localhost:3000</code> を許可済み。</p><p><code>index.html</code> の <code>&lt;button id="login"&gt;</code> の次の行に、ボタンを1行足す。</p><pre>&lt;button id="call"&gt;call /me&lt;/button&gt; &lt;button id="callo"&gt;call /orders&lt;/button&gt;</pre><p><code>&lt;/script&gt;</code> の直前に、次の関数を足す。</p><pre>const callApi = (path) =&gt; async () =&gt; {                 // Access Token を Bearer で API に渡す
  if (!window.tokens) return log('not logged in', {});
  const r = await fetch('http://localhost:4000' + path, { headers: { Authorization: 'Bearer ' + window.tokens.access_token } });
  log('API ' + path + ' -&gt; ' + r.status, await r.json());
};
document.getElementById('call').onclick = callApi('/me');
document.getElementById('callo').onclick = callApi('/orders');</pre><p>ブラウザをリロードし、「login」でログインし、「call /me」を押す。</p><div class="check"><b>確認</b><pre class="out">## API /me -&gt; 200
{ "sub": "…", "username": "alice", "azp": "frontend-spa", "aud": [ "api-service", "account" ] }</pre></div><div class="read"><b>読み方</b><p>画面に API の応答が出る。</p><p><code>azp: frontend-spa</code> で 200 なら、SPA が取ったトークンで API が alice を識別した。Console に CORS エラーが出るなら、API の <code>Access-Control-Allow-Origin</code> が <code>http://localhost:3000</code> でない、または API が起動していない。401 はトークンの期限切れ (5分) か、ログインし直していない。</p></div></div><div class="step"><h4>手順 2　scope を足して /orders を呼ぶ</h4><p>「call /orders」を押す。ログイン時の scope は <code>openid</code> のままなので 403 になる。<code>scope: 'openid'</code> の行を <code>openid orders:read</code> に変えて、もう一度ログインして試す。</p><div class="check"><b>確認</b><pre class="out">## API /orders -&gt; 403
{ "error": "scope orders:read required" }
(scope に orders:read を足した後)
## API /orders -&gt; 200
{ "orders": [ 1, 2, 3 ] }</pre></div><div class="read"><b>読み方</b><p>最初は 403、scope を足した後は 200。</p><p>アプリが要求するスコープが API の認可の入口。Optional な scope は要求したときだけトークンに載る。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l04-p02', title: `通しのチェックリスト: どこで何を確かめたか`,
        html: `<p class="goal">やりたいこと: 1回のログインから API 呼び出しまでの流れ (0〜10) を、これまでに手を動かして確認した場所と対応づけて整理する。どの段階がどの仕組みを担当するかが頭に入っていれば、障害の切り分けが速くなる。</p><div class="step"><h4>手順 1　通信を記録して番号を探す</h4><p>SPA を開き、開発者ツールの Network タブ (Preserve log On) を表示して、「login」→ ログイン → 「call /me」を行う。記録を上から順に読み、下の番号を探す。</p><div class="check"><b>確認</b><pre class="out">auth → callback (code, state) → token → API /me の順に並ぶ</pre></div><div class="read"><b>読み方</b><p>各番号が次の場所に対応する。</p><ul><li>0: state / nonce / verifier を作る (SPA のコード。第7章の仕組み)</li><li>1: GET /auth (state, nonce, challenge) (Network: <code>auth</code>)</li><li>2〜3: 302 で code と state が戻り、state を照合 (Network / 画面「1. callback」)</li><li>4〜5: POST /token (code + verifier)。Keycloak が PKCE を検証 (Network: <code>token</code>)</li><li>6: JWT (署名つき・kid つき) を受け取る (画面「2. token response」)</li><li>7: ID トークンの署名・nonce・iss・aud・exp を検証 (画面 (nonce) / シェル)</li><li>8: Bearer で API を呼ぶ (Network: <code>localhost:4000/me</code>)</li><li>9: API が kid で鍵を選び署名・iss・exp・ロール・scope を検証 (API のレスポンス 200/401/403)</li><li>10: 200 JSON (画面「API /me」)</li></ul><p>0〜3 は state と PKCE の準備と照合 (アプリ側)、4〜5 は Keycloak による verifier の検証、6 で JWT を受け取り、7 で ID トークンを検証し、8〜10 で API 呼び出し。失敗の切り分けは、auth で止まる (redirect_uri / client_id)、callback の後で止まる (state)、token で止まる (PKCE・secret・code 使用済み)、ID トークンで止まる (nonce・iss)、API で止まる (401 = 検証、403 = 権限)。即時失効が必要な場合だけ introspection を追加で呼ぶ (第8章 l03 p02)。</p></div></div><div class="step"><h4>手順 2　ID トークンの検証 (7) をシェルで再現する</h4><p>画面の「3. id_token」の値を使う代わりに、ここでは直近のトークンを使う。</p><pre>IDT=$(get_token alice | jq -r .id_token)
jwt $IDT | jq '{iss, aud, azp, exp: (.exp|todate)}'
jwth $IDT | jq -r .kid
curl -s $OIDC/certs | jq -r '.keys[].kid'</pre><div class="check"><b>確認</b><pre class="out">ID トークンの kid が JWKS の kid の一覧に含まれる。</pre></div><div class="read"><b>読み方</b><p>含まれていれば、署名検証に必要な鍵が公開されている。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c08-l05', title: `Authorization Code Flow (+PKCE) の手順`, pages: [
      { id: 'c08-l05-p01', title: `ステップ1: verifier と challenge を作る`,
        html: `<p class="goal">やりたいこと: ここからは Authorization Code Flow をブラウザと curl で1ステップずつ手で実行する。最初の一歩は、アプリがログインのたびにやる PKCE の準備 (verifier と challenge の生成)。以降のページは同じシェルで続ける (変数が消えるので、途中でターミナルを閉じない)。</p><div class="step"><h4>手順 1　verifier と challenge を作る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> は Public・Standard flow On・PKCE S256・Valid redirect URIs = <code>http://localhost:3000/*</code> で設定済み。</p><pre>VERIFIER=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\\n' | cut -c1-64)
echo $VERIFIER
CHALLENGE=$(printf '%s' "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
echo $CHALLENGE</pre><div class="check"><b>確認</b><pre class="out">Zk3a…（64文字）
q8Xe…（43文字）</pre></div><div class="read"><b>読み方</b><p>64文字と43文字の文字列が出る。</p><p>verifier は 43〜128 文字の英数字・<code>-</code> <code>_</code> で、これが「鍵」。このシェルの変数 (<code>VERIFIER</code>) の中にだけ置き、URL には出さない。challenge は SHA-256 を Base64URL にした 43 文字で、これが「錠」。認可リクエストに付けて Keycloak に渡す。</p></div></div><div class="step"><h4>手順 2　state と nonce を作る</h4><pre>STATE=$(openssl rand -hex 8); NONCE=$(openssl rand -hex 8)
echo "state=$STATE nonce=$NONCE"</pre><div class="check"><b>確認</b><pre class="out">state=3f9a2b1c4d5e6f70 nonce=a1b2c3d4e5f60718</pre></div><div class="read"><b>読み方</b><p>16桁の16進数が2つ出る。</p><p>アプリが戻りで照合する使い捨ての値。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l05-p02', title: `ステップ2: 認可リクエストでログインし、code を受け取る`,
        html: `<p class="goal">やりたいこと: 作った challenge・state・nonce を付けて authorization endpoint を開き、ログインして code を受け取る。ブラウザが 302 で <code>redirect_uri</code> に戻る様子と、2回目は画面なしで戻る SSO の動きも確かめる。</p><div class="step"><h4>手順 1　ログインして code を受け取る</h4><p>前提: 前ページの変数 (<code>VERIFIER CHALLENGE STATE NONCE</code>) が同じシェルにある。</p><p>認可 URL を組み立てて表示し、ブラウザで開く。<code>alice</code> / <code>alice</code> でログインする。</p><pre>AUTH="$OIDC/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid%20orders:read&amp;state=$STATE&amp;nonce=$NONCE&amp;code_challenge=$CHALLENGE&amp;code_challenge_method=S256"
echo "$AUTH"
open "$AUTH"</pre><p>遷移先 (接続エラーや 404 でよい) のアドレスバーを読み、<code>code</code> と <code>state</code> を変数に入れる。</p><pre>CODE=ここにcode
RET_STATE=ここにstate
[ "$RET_STATE" = "$STATE" ] &amp;&amp; echo "state OK" || echo "state NG"</pre><div class="check"><b>確認</b><pre class="out">http://localhost:3000/manual?state=3f9a2b1c4d5e6f70&amp;session_state=…&amp;iss=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fdemo&amp;code=7a3f…
state OK</pre></div><div class="read"><b>読み方</b><p>アドレスバーに <code>code</code> と送った <code>state</code> が付き、照合は OK になる。</p><p>code は引換券であってトークンではない。state が一致したので、自分が出したログインの結果だと確認できた。code は約1分で失効し、1回しか使えないので、次のページで早めに交換する。</p><ul><li><code>Invalid parameter: redirect_uri</code> → Valid redirect URIs が合っていない。</li><li><code>invalid_scope</code> → <code>orders:read</code> が <code>frontend-spa</code> に Optional で割り当てられていない (第4章)。</li></ul></div></div><div class="step"><h4>手順 2　もう一度開いて SSO を見る</h4><p>もう一度 <code>open "$AUTH"</code> を実行する (state 以外は同じ)。</p><div class="check"><b>確認</b><pre class="out">ログイン画面が出ずに、すぐ戻る。</pre></div><div class="read"><b>読み方</b><p>Keycloak の SSO Cookie (セッション) が残っているため。アプリが何度ログインを要求しても、再入力は不要。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l05-p03', title: `ステップ3: code を token に交換する (Public client)`,
        html: `<p class="goal">やりたいこと: code と verifier を token endpoint に直接 POST してトークンに交換する。Public client は secret の代わりに verifier で本人を示す。</p><div class="step"><h4>手順 1　code を交換してトークンを取り出す</h4><p>1分以内に実行する。</p><pre>RES=$(curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$VERIFIER)
echo $RES | jq 'keys'
AT=$(echo $RES | jq -r .access_token); IDT=$(echo $RES | jq -r .id_token); RT=$(echo $RES | jq -r .refresh_token)
echo $RES | jq '{token_type, expires_in, refresh_expires_in, scope}'</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "id_token", "not-before-policy", "refresh_expires_in", "refresh_token", "scope", "session_state", "token_type" ]
{ "token_type": "Bearer", "expires_in": 300, "refresh_expires_in": 1800, "scope": "openid email profile orders:read company-info" }  (並びは前後することがある。company-info は第4章で Default にしたもの)</pre></div><div class="read"><b>読み方</b><p>3つのトークンを含むキーの一覧と、メタ情報が出る。</p><p>Keycloak が code・redirect_uri・verifier を検証して発行した。検証内容は、code が有効で未使用、redirect_uri が認可時と同一、SHA256(verifier) が保存済み challenge と一致。<code>token_type: Bearer</code> なので、Access Token は Bearer として API に渡す。</p><ul><li><code>PKCE verification failed</code> → 違う verifier を使った (別のターミナルで VERIFIER を作り直した等)。</li><li>1回目から <code>Code not valid</code> → 1分を超えた。認可リクエストからやり直す。</li></ul></div></div><div class="step"><h4>手順 2　同じ code を再度交換する</h4><p>注意: Keycloak は使用済みの code が再び提示されると、その code から発行したトークンのセッションも終了させる。この後で p04 の userinfo や refresh を使うなら、この手順は最後に回す (やった後は、認可リクエストからやり直す)。</p><pre>curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$VERIFIER | jq -c '{error, error_description}'</pre><div class="check"><b>確認</b><pre class="out">{"error":"invalid_grant","error_description":"Code not valid"}</pre></div><div class="read"><b>読み方</b><p>エラーが返る。</p><p>code は使い捨て。しかも再提示された時点で、1回目に得た Access Token の userinfo は 401 になり (introspection は active: false)、Refresh Token も <code>Session doesn't have required client</code> で使えなくなった。自作 API のローカル検証は期限まで 200 のまま (JWT のローカル検証は署名と <code>exp</code> しか見ないため)。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l05-p04', title: `ステップ4: ID トークンを検証する (署名・iss・aud・exp・nonce)`,
        html: `<p class="goal">やりたいこと: クライアントは ID トークンを受け取ったら、署名・<code>iss</code>・<code>aud</code>・<code>exp</code>・<code>nonce</code> を確かめてからログインを成立させる。ライブラリが自動でやる検証を、シェルで1つずつ実行する。</p><div class="step"><h4>手順 1　claim を検証する</h4><p>前提: 前ページの <code>IDT</code> と <code>NONCE</code> がある。</p><pre>P=$(jwt $IDT)
echo "iss   : $([ "$(echo $P | jq -r .iss)" = "$KC" ] &amp;&amp; echo OK || echo NG)"
echo "aud   : $([ "$(echo $P | jq -r .aud)" = "frontend-spa" ] &amp;&amp; echo OK || echo NG)"
echo "exp   : $([ $(echo $P | jq .exp) -gt $(date +%s) ] &amp;&amp; echo OK || echo NG)"
echo "nonce : $([ "$(echo $P | jq -r .nonce)" = "$NONCE" ] &amp;&amp; echo OK || echo NG)"</pre><div class="check"><b>確認</b><pre class="out">iss   : OK
aud   : OK
exp   : OK
nonce : OK</pre></div><div class="read"><b>読み方</b><p>4項目がすべて OK になる。</p><p>このトークンは「本物 (署名・iss)」で「自分宛 (aud)」で「期限内 (exp)」で「今回のログインのもの (nonce)」。<code>nonce : NG</code> は別のログインの ID トークンを使っているか、NONCE 変数が上書きされている。<code>iss : NG</code> は 127.0.0.1 で取った、など。</p></div></div><div class="step"><h4>手順 2　署名検証に使う鍵を確かめる</h4><pre>KID=$(jwth $IDT | jq -r .kid)
curl -s $OIDC/certs | jq --arg k $KID '[.keys[] | select(.kid==$k and .use=="sig")] | length'</pre><p>署名そのものの検証は、Keycloak の userinfo (Access Token を Bearer で) で代用して確認する (p03 で同じ code を再交換した後だと、セッションが終了していて 401 になり、何も表示されない)。</p><pre>curl -s -H "Authorization: Bearer $AT" $OIDC/userinfo | jq -c '{preferred_username}'</pre><div class="check"><b>確認</b><pre class="out">1
{"preferred_username":"alice"}</pre></div><div class="read"><b>読み方</b><p>kid に合う鍵が 1 つあり、userinfo が alice を返す。</p><p>kid の鍵が JWKS にあり、署名検証 (RS256) の実装はライブラリ (<code>jose</code> 等) に任せるのが普通。API 側でライブラリが実際に署名検証する様子は第8章 l03 p01。Access Token の検証は API の仕事 (<code>aud</code> / ロール / scope まで見る)、ID トークンの検証はアプリ自身の仕事。</p></div></div>`,
        oxIds: [] },
      { id: 'c08-l05-p05', title: `ステップ5: Bearer で API を呼ぶ。Confidential (backend-web) では何が変わるか`,
        html: `<p class="goal">やりたいこと: 得た Access Token で API を呼び、フローを完結させる。最後に Confidential の <code>backend-web</code> で同じ手順を行い、token 交換が「secret を Basic ヘッダで付ける」形に変わるだけだと確かめる。</p><div class="step"><h4>手順 1　Access Token で API を呼ぶ</h4><p>前提: API (第8章 l03 p01 で作った <code>~/develop/kc-handson/api/server.js</code> を <code>cd ~/develop/kc-handson/api &amp;&amp; node server.js</code> で起動している) が <code>:4000</code> で動いている。<code>backend-web</code> の secret が <code>$WEB_SECRET</code>、Valid redirect URIs が <code>http://localhost:3001/*</code>。ステップ1〜3の変数が残っている。</p><pre>curl -s -H "Authorization: Bearer $AT" localhost:4000/me | jq -c .
curl -s -o /dev/null -w '/orders: %{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/orders</pre><div class="check"><b>確認</b><pre class="out">{"sub":"…","username":"alice","azp":"frontend-spa","aud":["api-service","account"]}
/orders: 200</pre></div><div class="read"><b>読み方</b><p><code>/me</code> が alice を返し、<code>/orders</code> が 200。</p><p>API が Bearer を検証して alice を識別した。フローが <b>認可リクエスト → code → token 交換 → API</b> の順で完結した。</p></div></div><div class="step"><h4>手順 2　backend-web で secret を付けて交換する</h4><p>新しい verifier / challenge で認可リクエストを開く (client_id と redirect_uri を変える)。</p><pre>VERIFIER=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\\n' | cut -c1-64)
CHALLENGE=$(printf '%s' "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
open "$OIDC/auth?client_id=backend-web&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3001/manual&amp;scope=openid&amp;state=s2&amp;nonce=n2&amp;code_challenge=$CHALLENGE&amp;code_challenge_method=S256"</pre><p>アドレスバーの code で、secret を付けて交換する。</p><pre>CODE=ここにcode
curl -s -X POST $OIDC/token -u backend-web:$WEB_SECRET -d grant_type=authorization_code -d code=$CODE -d redirect_uri=http://localhost:3001/manual -d code_verifier=$VERIFIER | jq 'keys'</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "id_token", "refresh_expires_in", "refresh_token", … ]</pre></div><div class="read"><b>読み方</b><p>トークンのキーの一覧が出る。</p><p>Confidential の交換は <code>-u backend-web:$WEB_SECRET</code> が増えるだけで他は同じ。違いは「token endpoint で本人証明に secret を使えるか」で、PKCE を併用しても構わない。</p></div></div><div class="step"><h4>手順 3　secret なしで交換する</h4><p>別の code を取り直し、secret なしで交換する。</p><pre>curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=backend-web -d code=$CODE -d redirect_uri=http://localhost:3001/manual -d code_verifier=$VERIFIER | jq -c '{error, error_description}'</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized_client","error_description":"Invalid client or Invalid client credentials"}</pre></div><div class="read"><b>読み方</b><p>エラーが返る。</p><p>Confidential は secret なしでは交換できない (第6章)。<code>Code not valid</code> と出た場合は、そのコードは前の交換で使用済みなので、認可リクエストからやり直す。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c08-l06', title: `Authorization Code Flow のシーケンス図`, pages: [
      { id: 'c08-l06-p01', title: `ブラウザの Network タブでシーケンス図を再現する`,
        html: `<p class="goal">やりたいこと: シーケンス図 (User/Browser → App → Keycloak → API) は、実際の通信の順番そのもの。SPA のログインを記録し、図の矢印が Network タブの何行目に当たるかを確かめる。</p><div class="step"><h4>手順 1　ログインを記録して順に読む</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) と API (第8章 l03 p01 で作った <code>~/develop/kc-handson/api/server.js</code> を <code>cd ~/develop/kc-handson/api &amp;&amp; node server.js</code> で起動している) が動いている。「call /me」ボタンは第8章 l04 p01 で <code>index.html</code> に足したもの。無ければ Console で <code>fetch('http://localhost:4000/me', { headers: { Authorization: 'Bearer ' + tokens.access_token } }).then(r =&gt; r.json()).then(console.log)</code> を実行する。管理コンソールの「Sessions」で「Action」→「Sign out all active sessions」→「Confirm」を押して SSO セッションを空にしてから始める (残っているとログイン画面が出ずに戻る)。</p><p>SPA を開き、開発者ツールの Network タブで「Preserve log」を On にする。「login」を押し、ログインを完了し、「call /me」を押す。記録の「Name」と「Status」を上から順に読み、各行の Request URL と Status Code を見る。</p><div class="check"><b>確認</b><pre class="out">1. GET  localhost:3000/                       200  (SPA 本体)
2. GET  localhost:8080/…/auth?client_id=…     302  → 認可リクエスト (login を押した結果)
3. GET  localhost:8080/…/login-actions/…      200  (ログイン画面 → alice を入力して POST、302)
4. GET  localhost:3000/?…&amp;code=…&amp;state=…      200  (code が戻る)
5. POST localhost:8080/…/token                200  (code → token。Payload に code_verifier)
6. GET  localhost:4000/me                     200  (Authorization: Bearer …)</pre></div><div class="read"><b>読み方</b><p>通信の順番が次のようになる (典型例)。</p><p>2 → 3 → 4 は、ブラウザが Keycloak へ移動し、ログインし、302 で戻る「ブラウザ経由」の通信 (フロントチャネル)。5 は SPA の JS から Keycloak へ直接の code の交換で、Web アプリではこれがサーバー内で行われ Network に出ない。6 の Request Headers に <code>Authorization: Bearer</code> があるのが、API を呼ぶ最後の矢印。</p><ul><li>ログイン済み (SSO) だと 3 が省略される。</li><li><code>Preserve log</code> が Off だとページ遷移で記録が消える。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c08-l06-p02', title: `ブラウザなしで、curl だけでフロー全体を通す`,
        html: `<p class="goal">やりたいこと: ブラウザが裏で行っている Cookie の運び方、ログインフォームの送信、302 の追跡を、curl で全部再現する。フローが「HTTP のやり取りの連続」にすぎないことを実感する。</p><div class="step"><h4>手順 1　認可リクエストを送り、フォームの送信先を取り出す</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 設定済み。</p><p>Cookie 保存用のファイルと PKCE 値を用意する。</p><pre>JAR=$(mktemp)
V=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\\n' | cut -c1-64)
C=$(printf '%s' "$V" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')</pre><p>認可リクエストを送り、ログインフォームの送信先 (action) を取り出す。</p><pre>FORM=$(curl -s -c $JAR "$OIDC/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;state=s3&amp;nonce=n3&amp;code_challenge=$C&amp;code_challenge_method=S256")
ACTION=$(echo "$FORM" | grep -o 'action="[^"]*"' | head -1 | sed 's/action="//; s/"$//; s/&amp;amp;/\\&amp;/g')
echo "\${ACTION:0:120}..."</pre><div class="check"><b>確認</b><pre class="out">http://localhost:8080/realms/demo/login-actions/authenticate?session_code=…&amp;execution=…&amp;client_id=frontend-spa&amp;tab_id=…...</pre></div><div class="read"><b>読み方</b><p>ログインフォームの送信先 URL が出る。</p><p>Cookie ファイル (<code>cat $JAR</code>) に Keycloak の認証セッション用の Cookie がある。ログインフォームの送信は、最初の認可リクエストと同じ Cookie を付けて行う必要があり、ブラウザがこれを自動でやっている。<code>ACTION</code> が空なら、ログインページの HTML が想定と違う (ログイン済み、必須アクションが出ている)。<code>echo "$FORM" | head</code> で中身を確認する。</p></div></div><div class="step"><h4>手順 2　ログインして code を token に交換する</h4><p>ID とパスワードを送り、302 の Location を読む。</p><pre>LOC=$(curl -s -i -b $JAR -c $JAR -d username=alice -d password=alice "$ACTION" | grep -i '^location:' | tr -d '\\r' | sed 's/^[Ll]ocation: //')
echo "$LOC"</pre><p>Location から code を取り出し、token に交換する。</p><pre>CODE=$(echo "$LOC" | sed 's/.*[?&amp;]code=\\([^&amp;]*\\).*/\\1/')
curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$V | jq 'keys'</pre><div class="check"><b>確認</b><pre class="out">http://localhost:3000/manual?state=s3&amp;session_state=…&amp;iss=…&amp;code=…
[ "access_token", "expires_in", "id_token", "not-before-policy", "refresh_expires_in", "refresh_token", "scope", "session_state", "token_type" ]</pre></div><div class="read"><b>読み方</b><p>Location に <code>code</code> が付き、token 交換のキーの一覧が出る。</p><p>Location は <code>redirect_uri?state=s3&amp;...&amp;code=...</code> で、これがブラウザに返る 302。ブラウザはこの URL に移動するだけで code が URL 経由で渡る。token 交換が成功すれば、ブラウザ無しでも認可リクエスト → ログイン → code → token の全体が通った。Location が空なら、ログイン済みかパスワード違い、必須アクションが出ている。</p></div></div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
