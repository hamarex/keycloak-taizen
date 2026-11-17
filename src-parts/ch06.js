// 第6章 ハンズオン形式
DATA.chapters.push({
  no: 6, title: `Client authentication ON / OFF`,
  lessons: [
    { id: 'c06-l01', title: `要点・比較表・token リクエストの差`, pages: [
      { id: 'c06-l01-p01', title: `Confidential client backend-web を作る`,
        html: `<p class="goal">やりたいこと: <b>Client authentication = On</b> のクライアントは Confidential (secret で本人証明できる)、Off は Public。違いを token リクエストで比べるために、サーバーサイド Web アプリ用の Confidential client <code>backend-web</code> を作り、Public の <code>frontend-spa</code> と並べる。この章と第7〜9章で使う。</p>
<div class="step">
<h4>手順 1　backend-web を作る</h4>
<p>「Clients」→「Create client」を押し、Client type = <code>OpenID Connect</code>、Client ID = <code>backend-web</code> で「Next」を押す。Capability config: Client authentication = <code>On</code>、Authorization = <code>Off</code>、Authentication flow は「Standard flow」と「Direct access grants」にチェック (後者は curl で比較するための学習用) して「Next」を押す。Login settings: Valid redirect URIs = <code>http://localhost:3001/*</code>、Valid post logout redirect URIs = <code>http://localhost:3001/*</code>、Web origins = <code>http://localhost:3001</code> を入力して「Save」を押す。</p>
<div class="check"><b>確認</b>
<pre class="out">backend-web の Settings 上部に Credentials タブが並び、frontend-spa には Credentials タブが無い。</pre></div>
<div class="read"><b>読み方</b>
<p>Credentials タブがあるのは Confidential だけ。secret を持つのは Confidential だけということ。Valid post logout redirect URIs を入れ忘れると、第9章の logout で戻り先が拒否される。</p></div>
</div>
<div class="step">
<h4>手順 2　secret を控えて、API 上の差を見る</h4>
<p><code>backend-web</code> の「Credentials」タブで Client Authenticator が <code>Client Id and Secret</code> であることを確認し、Client secret を <code>~/develop/kc-handson/kc-lab.sh</code> に追記して読み込む。</p>
<pre>echo 'export WEB_SECRET=ここにbackend-webのsecret' &gt;&gt; ~/develop/kc-handson/kc-lab.sh
source ~/develop/kc-handson/kc-lab.sh
ADM=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=admin -d password=admin | jq -r .access_token)
for c in frontend-spa backend-web; do curl -s -H "Authorization: Bearer $ADM" "http://localhost:8080/admin/realms/demo/clients?clientId=$c" | jq -c '.[0] | {clientId, publicClient}'; done</pre>
<div class="check"><b>確認</b>
<pre class="out">{"clientId":"frontend-spa","publicClient":true}
{"clientId":"backend-web","publicClient":false}</pre></div>
<div class="read"><b>読み方</b>
<p><code>publicClient</code> が true/false で分かれる。Client authentication Off = Public、On = Confidential で、API 上の実体は <code>publicClient</code> フラグ。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c06-l01-p02', title: `token リクエストの差: secret の有無で成否が分かれる`,
        html: `<p class="goal">やりたいこと: 同じユーザー (alice) のトークンを Public と Confidential で取り、secret を付ける/付けないで何が起きるかを比べる。「token endpoint でこのクライアントが本人だと証明できるか」が ON/OFF の本質。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>backend-web</code> 作成済み (<code>$WEB_SECRET</code>)。</p>
<div class="step">
<h4>手順 1　Public は secret なしで取れる</h4>
<pre>curl -s -X POST $OIDC/token -d grant_type=password -d client_id=frontend-spa -d username=alice -d password=alice | jq 'has("access_token")'</pre>
<div class="check"><b>確認</b>
<pre class="out">true</pre></div>
<div class="read"><b>読み方</b>
<p>Public は secret なしで通る。怖く見えるが、Password Grant は学習用の近道。本物の Auth Code Flow では code が必要で、PKCE が横取りを防ぐ (第7・8章)。</p></div>
</div>
<div class="step">
<h4>手順 2　Confidential を secret なしで呼ぶ</h4>
<pre>curl -s -X POST $OIDC/token -d grant_type=password -d client_id=backend-web -d username=alice -d password=alice | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "unauthorized_client", "error_description": "Invalid client or Invalid client credentials" }</pre></div>
<div class="read"><b>読み方</b>
<p>拒否されるなら、Confidential の token endpoint はクライアント認証が必須ということ。</p></div>
</div>
<div class="step">
<h4>手順 3　secret を Basic と body の2通りで渡す</h4>
<pre>curl -s -X POST $OIDC/token -u backend-web:$WEB_SECRET -d grant_type=password -d username=alice -d password=alice | jq 'has("access_token")'
curl -s -X POST $OIDC/token -d client_id=backend-web -d client_secret=$WEB_SECRET -d grant_type=password -d username=alice -d password=alice | jq 'has("access_token")'</pre>
<div class="check"><b>確認</b>
<pre class="out">true
true</pre></div>
<div class="read"><b>読み方</b>
<p>1行目は Basic 認証 (<code>client_secret_basic</code>)、2行目は body (<code>client_secret_post</code>)。</p><p>どちらでも通るなら、渡し方 (ヘッダ/body) が違うだけ。Credentials タブの Client Authenticator が「Client Id and Secret」なら両方許可される。</p></div>
</div>
<div class="step">
<h4>手順 4　間違った secret で呼ぶ</h4>
<pre>curl -s -X POST $OIDC/token -u backend-web:wrong -d grant_type=password -d username=alice -d password=alice | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "unauthorized_client", "error_description": "Invalid client or Invalid client credentials" }</pre></div>
<div class="read"><b>読み方</b>
<p>secret が違うと Public 扱いにはならず拒否される。「secret を付けなければ通る」ということは無い。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c06-l01-p03', title: `Client Credentials は Confidential 専用`,
        html: `<p class="goal">やりたいこと: ユーザー不在でクライアント自身がトークンを取る <b>Client Credentials</b> は、secret を持てる Confidential client だけの機能。Public では使えないことを確かめ、使えるクライアント <code>batch-job</code> を作る。</p>
<div class="step">
<h4>手順 1　Public で試す</h4>
<pre>curl -s -X POST $OIDC/token -d grant_type=client_credentials -d client_id=frontend-spa | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "unauthorized_client", "error_description": "Public client not allowed to retrieve service account" }</pre></div>
<div class="read"><b>読み方</b>
<p>本人証明できないクライアントに「クライアント自身のトークン」は発行されない。</p></div>
</div>
<div class="step">
<h4>手順 2　Service accounts roles が Off の Confidential で試す</h4>
<pre>curl -s -X POST $OIDC/token -u backend-web:$WEB_SECRET -d grant_type=client_credentials | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "unauthorized_client", "error_description": "Client not enabled to retrieve service account" }</pre></div>
<div class="read"><b>読み方</b>
<p>Confidential でも Service accounts roles が Off だと拒否される。Client Authentication On だけでは足りず、フローの許可 (Service accounts roles) も要る。</p></div>
</div>
<div class="step">
<h4>手順 3　batch-job を作って試す</h4>
<p>「Clients」→「Create client」で Client ID = <code>batch-job</code>、Client authentication = <code>On</code>、Authentication flow は「Service accounts roles」だけにチェックして「Save」を押す。「Credentials」タブの secret を <code>~/develop/kc-handson/kc-lab.sh</code> に <code>BATCH_SECRET</code> として追記して読み込み、試す。</p>
<pre>echo 'export BATCH_SECRET=ここにbatch-jobのsecret' &gt;&gt; ~/develop/kc-handson/kc-lab.sh; source ~/develop/kc-handson/kc-lab.sh
curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | jq 'keys'</pre>
<div class="check"><b>確認</b>
<pre class="out">[ "access_token", "expires_in", "not-before-policy", "refresh_expires_in", "scope", "token_type" ]</pre></div>
<div class="read"><b>読み方</b>
<p><code>access_token</code> が取れる。<code>id_token</code> と <code>refresh_token</code> が無いのは、ユーザー不在でログインの結果 (ID Token) も更新 (Refresh) も無いから。使い方の詳細は第9章。</p><ul><li>Credentials タブが無い: Client authentication が Off のまま。</li></ul></div>
</div>`,
        oxIds: [] },
      { id: 'c06-l01-p04', title: `Web アプリ (Confidential) を自作し、secret が token リクエストで使われるのを見る`,
        html: `<p class="goal">やりたいこと: 同じ Authorization Code Flow でも、Public の <code>frontend-spa</code> (ブラウザ上の JS、第7章) と Confidential の <code>backend-web</code> (サーバー) では token リクエストが違う。Confidential 側のサーバーアプリを最小限で書き、secret が<b>サーバーの中だけで</b>使われ、ブラウザには出ないことを確かめる。state / nonce / PKCE の詳細は第7章で扱うので、ここでは「code を secret 付きで交換する」部分に注目する。 前提: <code>backend-web</code> 作成済み (Valid redirect URIs = <code>http://localhost:3001/*</code>)、secret を <code>$WEB_SECRET</code> に控え済み。Node.js 20 以上。ブラウザは必ず <code>localhost</code> でアクセスする。</p>
<div class="step">
<h4>手順 1　server.js を作って起動する</h4>
<p><code>~/develop/kc-handson/web/server.js</code> を次の内容で作る (依存パッケージなし)。</p>
<pre>const http = require('http'), crypto = require('crypto');
const ISS = 'http://localhost:8080/realms/demo';        // issuer (第2章)
const CLIENT = 'backend-web';
const SECRET = process.env.CLIENT_SECRET;                // secret は環境変数で渡す (コードに書かない)
const REDIRECT = 'http://localhost:3001/callback';       // Valid redirect URIs に含まれる URL
if (!SECRET) throw new Error('CLIENT_SECRET を環境変数で指定してください');
const sessions = new Map();                               // sid -&gt; { state, nonce, verifier, tokens }
const b64u = (b) =&gt; Buffer.from(b).toString('base64url');
const decode = (jwt) =&gt; JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url')); // payload を読むだけ (署名検証はしない)
const sidOf = (req) =&gt; (/sid=([\\w-]+)/.exec(req.headers.cookie || '') || [])[1];
const send = (res, code, body, h = {}) =&gt; { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', ...h }); res.end(body); };

http.createServer(async (req, res) =&gt; {
  const url = new URL(req.url, 'http://localhost:3001');
  if (url.pathname === '/') {                             // トップ: ログイン後は claim を表示
    const s = sessions.get(sidOf(req));
    const view = s &amp;&amp; s.tokens ? { id_token: decode(s.tokens.id_token), access_token: decode(s.tokens.access_token) } : 'not logged in';
    return send(res, 200, '&lt;a href="/login"&gt;login&lt;/a&gt;&lt;pre&gt;' + JSON.stringify(view, null, 2) + '&lt;/pre&gt;');
  }
  if (url.pathname === '/login') {                        // 認可リクエストを作って Keycloak へリダイレクト
    const id = crypto.randomUUID();
    const s = { state: b64u(crypto.randomBytes(16)), nonce: b64u(crypto.randomBytes(16)), verifier: b64u(crypto.randomBytes(48)) };
    sessions.set(id, s);                                  // state/nonce/verifier はサーバーのセッションに保存
    const p = new URLSearchParams({ client_id: CLIENT, response_type: 'code', redirect_uri: REDIRECT, scope: 'openid',
      state: s.state, nonce: s.nonce, code_challenge: b64u(crypto.createHash('sha256').update(s.verifier).digest()), code_challenge_method: 'S256' });
    return send(res, 302, '', { Location: ISS + '/protocol/openid-connect/auth?' + p, 'Set-Cookie': 'sid=' + id + '; HttpOnly; Path=/' });
  }
  if (url.pathname === '/callback') {                     // code を token に交換 (バックチャネル)
    const s = sessions.get(sidOf(req));
    if (!s || url.searchParams.get('state') !== s.state) return send(res, 400, 'state mismatch');   // state 照合
    const r = await fetch(ISS + '/protocol/openid-connect/token', { method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(CLIENT + ':' + SECRET).toString('base64') }, // ← secret はここ
      body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: REDIRECT, code_verifier: s.verifier }) });
    const tokens = await r.json();
    console.log('token response:', r.status, r.ok ? Object.keys(tokens) : tokens);   // ターミナルに出す
    if (!r.ok) return send(res, 400, '&lt;pre&gt;' + JSON.stringify(tokens, null, 2) + '&lt;/pre&gt;');
    if (decode(tokens.id_token).nonce !== s.nonce) return send(res, 400, 'nonce mismatch');         // nonce 照合
    s.tokens = tokens;                                    // トークンはサーバーに保持。ブラウザには Cookie の sid だけ
    return send(res, 302, '', { Location: '/' });
  }
  send(res, 404, 'not found');
}).listen(3001, () =&gt; console.log('web app on http://localhost:3001'));</pre>
<p>secret を環境変数で渡して起動する (secret は自分の値に置き換える)。</p>
<pre>cd ~/develop/kc-handson/web
CLIENT_SECRET=ここにbackend-webのsecret node server.js</pre>
<div class="check"><b>確認</b>
<pre class="out">ターミナルに web app on http://localhost:3001 と出る。</pre></div>
<div class="read"><b>読み方</b>
<p>出れば起動できている。<code>CLIENT_SECRET を環境変数で指定してください</code> で落ちるなら、環境変数なしで起動している。</p></div>
</div>
<div class="step">
<h4>手順 2　ログインして、画面とターミナルを読む</h4>
<p>ブラウザで <code>http://localhost:3001/</code> を開き、「login」を押して <code>alice</code> / <code>alice</code> でログインする。</p>
<div class="check"><b>確認</b>
<pre class="out">{ "id_token": { "iss": "http://localhost:8080/realms/demo", "aud": "backend-web", "azp": "backend-web", "nonce": "…", "preferred_username": "alice", … },
  "access_token": { "azp": "backend-web", … } }

token response: 200 [ 'access_token', 'expires_in', 'refresh_expires_in', 'refresh_token', 'token_type', 'id_token', 'not-before-policy', 'session_state', 'scope' ]</pre></div>
<div class="read"><b>読み方</b>
<p>ログイン後の画面の JSON (抜粋) と、起動したターミナルの出力を読む。</p><p><code>azp</code> が <code>backend-web</code> で、画面に secret もトークン本体の文字列も出ていないなら、secret とトークンはサーバーの中だけにある。これが Confidential の強み。</p><ul><li><code>Invalid parameter: redirect_uri</code> の画面: <code>backend-web</code> の Valid redirect URIs が <code>http://localhost:3001/*</code> になっていない。</li><li><code>state mismatch</code>: Cookie が送られていない。<code>127.0.0.1</code> でアクセスしていないか確認する (必ず <code>localhost</code>)。</li></ul></div>
</div>
<div class="step">
<h4>手順 3　ブラウザの Cookie を見る</h4>
<p>ブラウザの開発者ツール (Application → Cookies) で <code>localhost:3001</code> の Cookie を見る。</p>
<div class="check"><b>確認</b>
<pre class="out">アプリが発行する Cookie は sid の1つだけ (HttpOnly。Keycloak 側の Cookie は別のパスに付くので、ここでは数えない)。</pre></div>
<div class="read"><b>読み方</b>
<p>ブラウザに渡っているのはセッション ID だけで、トークンはサーバーが保持している。この Web アプリは第7章で state / nonce / PKCE を「壊して」確認する対象でもある。Public の SPA で同じ交換をすると、secret 無しで <code>code_verifier</code> だけを送る形になる (第7章)。</p></div>
</div>
<div class="step">
<h4>手順 4　secret をわざと間違えて再起動する</h4>
<p>サーバーを止め (<code>Ctrl+C</code>)、secret を間違えて再起動し、もう一度ログインする。</p>
<pre>CLIENT_SECRET=wrong node server.js</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "unauthorized_client", "error_description": "Invalid client or Invalid client credentials" }</pre></div>
<div class="read"><b>読み方</b>
<p><code>unauthorized_client</code> なら token endpoint でクライアント認証が失敗している。code が正しくても交換できない。</p></div>
</div>`,
        oxIds: [] },
    ] },
    { id: 'c06-l02', title: `切替の影響・エラー・選び方`, pages: [
      { id: 'c06-l02-p01', title: `ON/OFF を切り替えると何が起きるか`,
        html: `<p class="goal">やりたいこと: 既存クライアントの Client authentication を切り替えると、タブや secret、使えるフローが変わる。安全に試せる <code>batch-job</code> で、切替の影響を事前に把握する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>batch-job</code> 作成済み (<code>$BATCH_SECRET</code>)。</p>
<div class="step">
<h4>手順 1　切替前に Client Credentials が通ることを確かめる</h4>
<pre>curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | jq 'has("access_token")'</pre>
<div class="check"><b>確認</b>
<pre class="out">true</pre></div>
<div class="read"><b>読み方</b>
<p><code>true</code> が切替前の基準。</p></div>
</div>
<div class="step">
<h4>手順 2　Client authentication を Off にする</h4>
<p><code>batch-job</code> の「Settings」で Client authentication を <code>Off</code> にして「Save」を押し、先に Credentials タブがあることを確認してから、タブと Capability config の変化を読む。そのうえで同じ Client Credentials を試す。</p>
<pre>curl -s -X POST $OIDC/token -d client_id=batch-job -d grant_type=client_credentials | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "unauthorized_client", "error_description": "Public client not allowed to retrieve service account" }</pre></div>
<div class="read"><b>読み方</b>
<p>Credentials タブが消え、Service accounts roles は選べなくなる (画面上の表示は要確認。Admin REST API では serviceAccountsEnabled が true のまま残った)。コマンドは次のエラーを返す。</p><p>Public 化すると、「ユーザー不在でクライアント自身がトークンを取る」機能は失われる。</p></div>
</div>
<div class="step">
<h4>手順 3　On に戻して secret を確かめる</h4>
<p>Client authentication を <code>On</code> に戻して「Save」を押し、Credentials タブで secret が以前と同じか確認する。古い <code>$BATCH_SECRET</code> でもう一度試す。必要なら Credentials の secret を <code>~/develop/kc-handson/kc-lab.sh</code> に反映し、Service accounts roles も On か確認する。</p>
<div class="check"><b>確認</b>
<pre class="out">secret は新しい値に変わっていて、古い secret では Invalid client or Invalid client credentials になる。</pre></div>
<div class="read"><b>読み方</b>
<p>OFF → ON で secret が新しく作られるので、既存のアプリに secret を設定し直さないと <code>unauthorized_client</code> / <code>invalid_client</code> になる。切替後に Service accounts roles が Off に戻っていたら、もう一度チェックして Save する。本番のクライアントを不用意に切り替えるとアプリが止まる。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c06-l02-p02', title: `よくあるエラー3つを再現し、選び方を決める`,
        html: `<p class="goal">やりたいこと: Client authentication まわりの失敗は3パターンに集約される。エラーメッセージを見ただけで原因が言えるようにし、最後にアプリ種別ごとの選び方を表で確認する。前提: <code>frontend-spa</code> (PKCE S256)、<code>backend-web</code>、<code>batch-job</code> が作成済みで、<code>$WEB_SECRET</code> <code>$BATCH_SECRET</code> が設定済み。</p>
<div class="step">
<h4>手順 1　Confidential なのに secret を付けない</h4>
<pre>curl -s -X POST $OIDC/token -d grant_type=password -d client_id=backend-web -d username=alice -d password=alice | jq -c '{error, error_description}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{"error":"unauthorized_client","error_description":"Invalid client or Invalid client credentials"}</pre></div>
<div class="read"><b>読み方</b>
<p><code>Invalid client or Invalid client credentials</code> は secret が無い/違うということ。アプリ設定の secret を疑う。</p></div>
</div>
<div class="step">
<h4>手順 2　Public で client_credentials を使う</h4>
<pre>curl -s -X POST $OIDC/token -d grant_type=client_credentials -d client_id=frontend-spa | jq -c '{error, error_description}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{"error":"unauthorized_client","error_description":"Public client not allowed to retrieve service account"}</pre></div>
<div class="read"><b>読み方</b>
<p><code>Public client not allowed to retrieve service account</code> はクライアント種別 (Public) とフローの不一致。Confidential に切り替えるか、フローを変える。</p></div>
</div>
<div class="step">
<h4>手順 3　PKCE を強制しているのに challenge なしで認可リクエストを開く</h4>
<pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid"</pre>
<div class="check"><b>確認</b>
<pre class="out">http://localhost:3000/manual?error=invalid_request&amp;error_description=Missing+parameter%3A+code_challenge_method&amp;iss=...</pre></div>
<div class="read"><b>読み方</b>
<p>アドレスバーを読む。エラー画面ではなく redirect_uri にエラー付きで戻される。</p><p><code>error=invalid_request</code> と <code>Missing parameter: code_challenge_method</code> は、PKCE を強制しているのにアプリが付けていないということ。アプリ側に PKCE を実装する。</p></div>
</div>
<div class="step">
<h4>手順 4　アプリ種別ごとの選び方を表に当てはめる</h4>
<p>下の表を、自分のアプリに当てはめる。</p>
<table><tr><th>アプリ</th><th>Client authentication</th><th>フロー</th></tr><tr><td>ユーザーログイン不要のサーバー間 (batch-job)</td><td>On</td><td>Client Credentials</td></tr><tr><td>サーバー側にコードがあり secret を隠せる Web (backend-web)</td><td>On</td><td>Auth Code (+PKCE 推奨)</td></tr><tr><td>ブラウザ/モバイルにコードが配布される (frontend-spa)</td><td>Off</td><td>Auth Code + PKCE</td></tr><tr><td>BFF 構成</td><td>BFF を On。SPA は直接 Keycloak と話さない</td><td>Auth Code</td></tr><tr><td>トークンを検証するだけの API (api-service)</td><td>不要。introspection するなら On</td><td>フローは全部 Off</td></tr></table>
<div class="check"><b>確認</b>
<pre class="out">表のどれかの行に自分のアプリが当たる。</pre></div>
<div class="read"><b>読み方</b>
<p>選び方の本質は「そのコードが誰の手元で動くか」。ユーザーの手元 (ブラウザ/モバイル) なら secret を持てず Off、自社サーバーなら On。</p></div>
</div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
