// Keycloak 大全集 data part 3: 章 8〜9
DATA.chapters.push({
  no: 8, title: `トークンの書式と Authorization Code Flow`,
  lessons: [
    { id: 'c08-l01', title: `JWT / JWS / JWE`, pages: [
      { id: 'c08-l01-p01', title: `JWT は「署名付きの書類」`,
        html: `<h4>JWT とは何か</h4><p><b class="key">JWT (JSON Web Token)</b> は、JSON の情報 (claim) を持ち運ぶための<b class="key">書式</b>である。「署名付きの書類」と思えばよい。</p><h4>3つの部分</h4><p>見た目は <code>xxxxx.yyyyy.zzzzz</code> のように、3つの部分を <code>.</code> でつないだものになる。各部分は Base64URL でエンコードされており、デコードすると次の中身が見える。</p><table><tr><th>部分</th><th>中身</th><th>例 (デコードしたもの)</th></tr><tr><td><b class="key">header</b></td><td>署名方式と鍵 ID</td><td><code>{"alg":"RS256","typ":"JWT","kid":"abc123"}</code></td></tr><tr><td><b class="key">payload</b></td><td>claim (本体)</td><td><code>{"iss":"...","sub":"...","aud":"...","exp":...}</code></td></tr><tr><td><b class="key">signature</b></td><td>改ざん防止の印</td><td>(バイナリ)</td></tr></table><span class="trap">JWT は暗号化ではない。payload は誰でも decode して読めるので、秘密情報を入れてはならない。</span>`,
        oxIds: ['c08-ox-01', 'c08-ox-02'] },
      { id: 'c08-l01-p02', title: `JWT・JWS・JWE の関係と署名の仕組み`,
        html: `<h4>3つの用語の関係</h4><ul><li><b class="key">JWT</b> = 中身の書式</li><li><b class="key">JWS (JSON Web Signature)</b> = JWT を<b class="key">署名</b>した形式。<b class="key">Keycloak の Access / ID Token は JWS 形式の JWT</b></li><li><b class="key">JWE (JSON Web Encryption)</b> = JWT を<b class="key">暗号化</b>した形式。中身が読めなくなる。Keycloak は通常使わない (設定すれば可)</li></ul><h4>署名の作り方 (RS256 = RSA + SHA-256)</h4><ol><li><code>base64url(header) + "." + base64url(payload)</code> を SHA-256 でハッシュする</li><li>そのハッシュを Keycloak の<b class="key">秘密鍵</b>で署名する → これが signature</li></ol><h4>検証の仕方</h4><p>受け取った側が<b class="key">公開鍵</b>で signature を確認する。一致すれば「Keycloak が作ったもので、改ざんされていない」と分かる。</p><span class="trap">署名があることと、中身が隠れていることは別である。JWS は読めるが改ざんできず、JWE は読めない。</span>`,
        oxIds: ['c08-ox-03', 'c08-ox-04'] }
    ] },
    { id: 'c08-l02', title: `kid と JWKS`, pages: [
      { id: 'c08-l02-p01', title: `JWKS: 公開鍵の一覧`,
        html: `<h4>解決したい問題</h4><p>API はどうやって「Keycloak の公開鍵」を知り、「どの鍵で署名されたか」を判断するのか。この答えが <b class="key">JWKS</b> と <b class="key">kid</b> である。</p><h4>JWKS (JSON Web Key Set)</h4><p>Keycloak が公開している<b class="key">公開鍵の一覧</b> (JSON) である。誰でも取得できる。</p><ul><li>場所: <code>GET /realms/myrealm/protocol/openid-connect/certs</code></li></ul><pre>{ "keys": [
  { "kid": "abc123", "kty": "RSA", "alg": "RS256", "use": "sig", "n": "0vx7agoebGcQ...", "e": "AQAB" },
  { "kid": "def456", "kty": "RSA", "alg": "RSA-OAEP", "use": "enc", "n": "...", "e": "AQAB" }
] }</pre><ul><li><code>kid</code> = 鍵の ID / <code>kty</code> = 鍵の種類 / <code>alg</code> = 用途のアルゴリズム</li><li><code>use: "sig"</code> = <b class="key">署名の検証用</b>、<code>enc</code> = 暗号化用 → 署名の検証には sig を使う</li><li><code>n</code>, <code>e</code> = RSA 公開鍵の本体 (数値)</li></ul>`,
        oxIds: ['c08-ox-05', 'c08-ox-06'] },
      { id: 'c08-l02-p02', title: `kid で鍵を選ぶ流れとローテーション`,
        html: `<h4>kid は「何番の鍵か」のラベル</h4><p>JWT の <b class="key">header</b> に <code>"kid":"abc123"</code> と書かれている。API は JWKS の中から<b class="key">同じ kid の鍵を探して</b>、署名の検証に使う。</p><p>JWKS に鍵が複数あるのは、<b class="key">ローテーション (鍵の入れ替え)</b> のためである。旧鍵で署名した古いトークンも検証できる。</p><h4>検証の流れ</h4><pre>API: token の header を読む ── kid = abc123
     │
     ▼
JWKS (キャッシュ) から kid=abc123 の公開鍵を探す
     │  (無ければ JWKS を再取得)
     ▼
公開鍵で signature を検証 ─ OK → payload を信用する / NG → 401</pre><p>一言でいえば、<b class="key">JWKS = 印鑑証明、kid = 「何番の印鑑か」の番号</b>である。</p>`,
        oxIds: ['c08-ox-07'] }
    ] },
    { id: 'c08-l03', title: `Bearer token と Introspection`, pages: [
      { id: 'c08-l03-p01', title: `Bearer token: 持参人式の入場券`,
        html: `<h4>Bearer = 持参人</h4><p>Bearer は「持参人」の意味で、<b class="key">持っている人は誰でも使える</b>ということである。映画のチケットと同じで、本人確認なしに、持っていれば入れる。</p><p>使い方は HTTP ヘッダに付けるだけである。</p><pre>GET /items HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...</pre><p>token レスポンスの <code>"token_type": "Bearer"</code> も、Access Token の <code>typ: Bearer</code> claim も同じ意味である。</p><h4>弱点と対策</h4><p>弱点は、<b class="key">盗まれたらそのまま悪用される</b>ことである。対策は HTTPS 必須 / 寿命を短く (5分) / URL (クエリ文字列) に入れない / ログに出さない、など。発展として、DPoP や mTLS で<b class="key">持ち主に紐づける</b> (Sender-constrained token) 方法もある。</p><h4>送り先の違い</h4><ul><li>Access Token は Bearer として<b class="key">API に送る</b></li><li>Refresh Token は Bearer だが<b class="key">Keycloak にしか送らない</b> (API に送らない)</li></ul>`,
        oxIds: ['c08-ox-08', 'c08-ox-09'] },
      { id: 'c08-l03-p02', title: `Introspection: トークンの有効確認窓口`,
        html: `<h4>ローカル検証だけでは足りない場面</h4><p>JWT は <code>exp</code> までは<b class="key">署名だけで有効に見える</b>。そのため、ログアウトや権限剥奪が即時には反映されない。</p><h4>Introspection の仕組み</h4><p>API が Keycloak に「このトークン、今も有効か」と<b class="key">問い合わせる</b>。</p><pre>POST /token/introspect   (API 自身の client 認証 + token=&lt;access_token&gt;)
→ {"active": true,  "sub": "...", "scope": "...", "aud": [...]}   有効
→ {"active": false}                                                 無効 (期限切れ・ログアウト・失効)</pre><h4>ローカル検証 (JWKS) との使い分け</h4><table><tr><th></th><th>ローカル検証 (JWKS)</th><th>Introspection</th></tr><tr><td>速度・負荷</td><td>速い。Keycloak に負荷なし</td><td>毎回通信が必要</td></tr><tr><td>失効の反映</td><td><code>exp</code> まで気づかない</td><td>即時反映</td></tr></table><p>詳細とシーケンス図は第10章で扱う。</p>`,
        oxIds: ['c08-ox-10', 'c08-ox-11'] }
    ] },
    { id: 'c08-l04', title: `1回のログインから API 呼び出しまで`, pages: [
      { id: 'c08-l04-p01', title: `まとめ図 (前半): ログイン準備からトークン受け取りまで`,
        html: `<h4>ここまでの部品が登場する位置</h4><p>state / nonce / PKCE / JWT 署名 / JWKS / Bearer / introspection が、1回のログインのどこで使われるかを図にまとめる。まず前半 (0〜7) である。</p><pre>   App(Client)                                Keycloak                                       API
    |                                             |                                           |
    | [0. make state, nonce, code_verifier]       |                                           |
    | [   code_challenge = SHA256(verifier)]      |                                           |
    |-- 1. GET /auth state,nonce,challenge ------&gt;|                                           |
    |                                             | [user logs in; Keycloak stores challenge] |
    |&lt;- 2. 302 redirect_uri?code=..&amp;state=.. -----|                                           |
    | [3. state matches the saved one?]           |                                           |
    |-- 4. POST /token code,verifier ------------&gt;|                                           |
    |                                             | [5. SHA256(verifier) == challenge ?]      |
    |                                             | [   sign tokens with private key (kid)]   |
    |&lt;- 6. access/id/refresh token (JWT) ---------|                                           |
    | [7. ID Token: verify signature by JWKS]     |                                           |
    | [   check nonce, iss, aud, exp]             |                                           |</pre><h4>読み方</h4><ul><li>0〜3: <b class="key">state</b> と <b class="key">PKCE</b> の準備と照合 (アプリ側)</li><li>4〜5: Keycloak が <b class="key">code_verifier</b> を検証 (PKCE)</li><li>6: <b class="key">JWT (JWS 署名、kid 付き)</b> を受け取る</li><li>7: ID Token を <b class="key">JWKS</b> で署名検証し、<b class="key">nonce</b> を照合</li></ul>`,
        oxIds: ['c08-ox-12'] },
      { id: 'c08-l04-p02', title: `まとめ図 (後半): API 呼び出しとトークン検証`,
        html: `<h4>後半 (8〜10 と option)</h4><p>アプリがトークンを手に入れたあと、API を呼び、API が検証するまでの部分である。</p><pre>   App(Client)                                Keycloak                                       API
    |                                             |                                           |
    |-- 8. GET /items  Authorization: Bearer &lt;AT&gt; -------------------------------------------&gt;|
    |                                             |&lt;- (first time only) GET /certs -&gt; JWKS ---|
    |                                             |         [9. find key by kid (JWKS cache)] |
    |                                             |      [   verify signature, iss, aud, exp] |
    |                                             |         [   check role (resource_access)] |
    |&lt;- 10. 200 JSON -------------------------------------------------------------------------|
    |                                             |                                           |
    |                                             |         [(option) POST /token/introspect] |
    |                                             |             [  -&gt; {"active": true/false}] |</pre><h4>読み方</h4><ul><li>8: <b class="key">Bearer token</b> で API を呼ぶ</li><li>9: API が <b class="key">kid → JWKS の公開鍵</b>で署名検証し、<code>iss</code> / <code>aud</code> / <code>exp</code> / ロールを確認する。JWKS は<b class="key">初回だけ取得してキャッシュ</b>する</li><li>(option): 即時失効を反映したいときは <b class="key">introspection</b></li></ul>`,
        oxIds: ['c08-ox-13'] }
    ] },
    { id: 'c08-l05', title: `Authorization Code Flow (+PKCE) の手順`, pages: [
      { id: 'c08-l05-p01', title: `全体の流れと「なぜ code を挟むのか」`,
        html: `<h4>登場人物と11段階の流れ</h4><p>登場人物は <b class="key">User / Browser / Client App / Keycloak</b> の4者で、最後に API (Resource Server) も登場する。流れは次の11段階である。</p><ol><li>ユーザーが「ログイン」をクリックする</li><li>(PKCE) クライアントが <code>code_verifier</code> と <code>code_challenge</code> を作る</li><li>ブラウザを Keycloak の authorization endpoint へリダイレクトする</li><li>Keycloak がログイン画面を出し、ユーザーが認証する</li><li>Keycloak がブラウザを <code>redirect_uri</code> に code 付きでリダイレクトする</li><li>クライアントが token endpoint で code を直接 (バックチャネルで) 交換する</li><li>Keycloak が検証する</li><li>トークンがレスポンスで返る</li><li>クライアントが ID Token を検証する</li><li>API を呼び出す</li><li>API が Access Token を検証する</li></ol><h4>なぜ code を挟むのか</h4><p>アクセストークンを<b class="key">ブラウザの URL (履歴・ログ・Referer)</b> に出さないためである。ブラウザには短命の code だけを通し、トークン本体は直接通信で受け取る。</p><h4>Implicit Flow との違い</h4><p>Implicit は URL fragment に直接トークンを載せる。<span class="trap">漏れやすく廃止方向</span>である。</p>`,
        oxIds: ['c08-ox-14', 'c08-ox-15'] },
      { id: 'c08-l05-p02', title: `手順2〜3: PKCE の準備と認可リクエスト`,
        html: `<h4>手順2: PKCE の準備</h4><p>クライアントが <code>code_verifier</code> をランダムに生成し、<code>code_challenge = BASE64URL(SHA256(code_verifier))</code> を作る。</p><pre>verifier  : dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
challenge : E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</pre><h4>手順3: authorization endpoint へリダイレクト</h4><pre>GET /realms/myrealm/protocol/openid-connect/auth
  ?client_id=frontend-spa
  &amp;response_type=code
  &amp;redirect_uri=http://localhost:3000/callback
  &amp;scope=openid profile email
  &amp;state=xyz123
  &amp;nonce=n-0S6_WzA2Mj
  &amp;code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &amp;code_challenge_method=S256</pre><ul><li><code>state</code> = <b class="key">CSRF 対策</b> (戻ってきた値を照合する)</li><li><code>nonce</code> = <b class="key">ID Token のリプレイ対策</b></li></ul><span class="trap">認可リクエストに付けるのは code_challenge であり、code_verifier ではない。verifier は手順6の token リクエストで初めて送る。</span>`,
        oxIds: ['c08-ox-16', 'c08-ox-17'] },
      { id: 'c08-l05-p03', title: `手順4〜5: ログインと code 付きリダイレクト`,
        html: `<h4>手順4: ログイン</h4><p>Keycloak がログイン画面を表示し、ユーザーが ID/パスワード (+MFA) を入力する。このとき Keycloak 側に <b class="key">SSO Cookie</b> (<code>KEYCLOAK_IDENTITY</code> 等) が作られる。2回目以降は SSO Cookie があれば、<b class="key">画面なしで即リダイレクト</b>される。</p><h4>手順5: code 付きでリダイレクト</h4><p>Keycloak がブラウザを <code>redirect_uri</code> にリダイレクトする。</p><pre>HTTP/1.1 302 Found
Location: http://localhost:3000/callback?code=7a3f...&amp;state=xyz123&amp;session_state=...&amp;iss=http://localhost:8080/realms/myrealm</pre><ul><li><code>code</code> = <b class="key">ワンタイム・短命 (約1分)</b> の引換券。トークンそのものではない</li><li>アプリは <code>state</code> が自分の送った値と一致するかを確認する</li></ul>`,
        oxIds: ['c08-ox-18', 'c08-ox-19'] },
      { id: 'c08-l05-p04', title: `手順6〜7: code の交換と Keycloak の検証`,
        html: `<h4>手順6: token endpoint で code を交換</h4><p>クライアントが token endpoint に<b class="key">直接 (バックチャネル)</b> で code を送る。Public client (Client authentication OFF) の例は次のとおり。</p><pre>POST /realms/myrealm/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&amp;client_id=frontend-spa
&amp;code=7a3f...
&amp;redirect_uri=http://localhost:3000/callback
&amp;code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk</pre><p>Confidential (ON) の場合は、これに <code>Authorization: Basic base64(backend-web:s3cr3t)</code> を追加する。</p><h4>手順7: Keycloak が検証する</h4><ul><li>code が<b class="key">有効・未使用</b>か</li><li><code>redirect_uri</code> が認可リクエスト時と<b class="key">同一</b>か</li><li><code>SHA256(code_verifier)</code> が保存済みの <code>code_challenge</code> と<b class="key">一致</b>するか</li><li>(ON なら) <b class="key">client secret</b> が正しいか</li></ul>`,
        oxIds: ['c08-ox-20', 'c08-ox-21'] },
      { id: 'c08-l05-p05', title: `手順8〜11: トークン受け取りと API 呼び出し`,
        html: `<h4>手順8: レスポンス</h4><pre>{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbGciOiJIUzUxMiIs...",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "not-before-policy": 0,
  "session_state": "e0f1a2b3-....",
  "scope": "openid profile email"
}</pre><h4>手順9: ID Token の検証</h4><p>クライアントが <b class="key">ID Token</b> を検証する。確認するのは署名、<code>iss</code>、<code>aud</code> (= <b class="key">自分の client_id</b>)、<code>exp</code>、<code>nonce</code> である。</p><h4>手順10〜11: API 呼び出しと検証</h4><pre>GET https://api.example.com/items
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...</pre><p>API (Resource Server) が <b class="key">Access Token を検証</b>する (詳細は第10章)。</p>`,
        oxIds: ['c08-ox-22'] }
    ] },
    { id: 'c08-l06', title: `Authorization Code Flow のシーケンス図`, pages: [
      { id: 'c08-l06-p01', title: `シーケンス図 (SPA 版)`,
        html: `<h4>Public client (frontend-spa) の流れ</h4><pre>User/Browser        Client App            Keycloak            API
    │  click login     │                     │                 │
    │─────────────────&gt;│ gen verifier/challenge                │
    │&lt;─ 302 /auth?...challenge ──────────────│                 │
    │──────────────── GET /auth ────────────&gt;│                 │
    │&lt;──────────── login page ───────────────│                 │
    │── username/password ──────────────────&gt;│                 │
    │&lt;─ 302 redirect_uri?code=..&amp;state=.. ───│                 │
    │─────────────────&gt;│ POST /token (code + verifier)         │
    │                  │────────────────────&gt;│ verify          │
    │                  │&lt;── access/id/refresh│                 │
    │                  │── GET /items  Authorization: Bearer ─&gt;│
    │                  │&lt;────────────── 200 ───────────────────│</pre><h4>読み方</h4><ul><li>Client App が verifier / challenge を作り、challenge 付きで <code>/auth</code> へ誘導する</li><li>ログイン後、<code>redirect_uri?code=..&amp;state=..</code> で戻ってくる</li><li>Client App が <b class="key">code + verifier</b> を token endpoint に送り、access / id / refresh token を受け取る</li><li>Client App が <b class="key">Bearer</b> 付きで API を呼ぶ</li></ul>`,
        oxIds: ['c08-ox-23'] },
      { id: 'c08-l06-p02', title: `シーケンス図 (Web 版 / Confidential)`,
        html: `<h4>Confidential client (backend-web) の流れ</h4><p>SPA 版との違いは、<b class="key">token 交換で secret を使う</b>ことと、<b class="key">トークンをサーバーに置く</b>ことである。</p><pre>User/Browser     Web App (server)        Keycloak              API
    │ click login      │                    │                   │
    │─────────────────&gt;│                    │                   │
    │&lt;─ 302 /auth?client_id=backend-web&amp;state=..&amp;redirect_uri=..│
    │────────────── GET /auth ─────────────&gt;│                   │
    │&lt;───────────── login page ─────────────│                   │
    │── username/password ─────────────────&gt;│                   │
    │&lt;─ 302 redirect_uri?code=..&amp;state=.. ──│                   │
    │─────────────────&gt;│ POST /token        │                   │
    │                  │  Authorization: Basic (client:secret)  │
    │                  │  code, redirect_uri│                   │
    │                  │───────────────────&gt;│ verify code+secret│
    │                  │&lt;─ access/id/refresh│                   │
    │                  │ (tokens kept on SERVER; browser gets only a session Cookie)
    │&lt;─ Set-Cookie: session ─│              │                   │
    │── page request (Cookie) ─&gt;│           │                   │
    │                  │── GET /items  Authorization: Bearer ──&gt;│
    │                  │&lt;───────────────── JSON ────────────────│
    │&lt;─ rendered page ─│                    │                   │</pre><ul><li>token リクエストは <code>Authorization: Basic (client:secret)</code> 付きで、サーバーが Keycloak に送る</li><li>ブラウザが受け取るのは<b class="key">セッション Cookie だけ</b>で、トークンはサーバーが保持する</li><li>API はサーバーが Bearer 付きで呼び、結果をレンダリングしたページとして返す</li></ul>`,
        oxIds: ['c08-ox-24'] }
    ] }
  ],
  ox: [
    { id: 'c08-ox-01', text: `JWT の payload は、Base64URL をデコードするだけで誰でも読める。そのため秘密情報を入れてはならない。`, answer: true, explain: `JWT は<b class="key">暗号化ではなく署名付きの書式</b>であり、payload は誰でも decode して読める。だから秘密情報を入れない。`, lesson: 'c08-l01' },
    { id: 'c08-ox-02', text: `JWT の header・payload・signature はいずれも暗号化されており、鍵を持たない第三者は中身を読めない。`, answer: false, explain: `JWT は暗号化ではない。header も payload も Base64URL をデコードすれば読める。signature は<b class="key">改ざん防止の印</b>であって、中身を隠すものではない。`, lesson: 'c08-l01' },
    { id: 'c08-ox-03', text: `Keycloak の Access Token と ID Token は、通常 JWE 形式であり、中身は暗号化されている。`, answer: false, explain: `通常は<b class="key">JWS 形式の JWT</b> (署名付き) である。JWE (暗号化形式) は Keycloak では通常使わず、設定すれば使える。`, lesson: 'c08-l01' },
    { id: 'c08-ox-04', text: `JWS の署名は Keycloak の秘密鍵で作られ、受け取った側は公開鍵で signature を確認する。`, answer: true, explain: `署名は<b class="key">秘密鍵</b>で作り、検証は<b class="key">公開鍵</b>で行う。一致すれば「Keycloak が作ったもので改ざんされていない」と分かる。`, lesson: 'c08-l01' },
    { id: 'c08-ox-05', text: `JWKS には署名検証用 (use が sig) の鍵と暗号化用 (use が enc) の鍵が載りうるが、JWT の署名検証に使うのは sig の鍵である。`, answer: true, explain: `<code>use: "sig"</code> が<b class="key">署名の検証用</b>、<code>enc</code> が暗号化用である。署名の検証には sig を使う。`, lesson: 'c08-l02' },
    { id: 'c08-ox-06', text: `JWKS は Keycloak が公開する公開鍵の一覧であり、取得するには API 自身の client 認証が必要である。`, answer: false, explain: `JWKS (<code>/certs</code>) は<b class="key">誰でも取得できる</b>。client 認証が必要なのは、Introspection のほうである。`, lesson: 'c08-l02' },
    { id: 'c08-ox-07', text: `kid は JWT の payload に含まれる claim で、JWKS の中から検証に使う鍵を探すためのラベルである。`, answer: false, explain: `kid が書かれているのは payload ではなく<b class="key">header</b>である。API は header の kid を読み、JWKS から同じ kid の鍵を探す。`, lesson: 'c08-l02' },
    { id: 'c08-ox-08', text: `Bearer token は持ち主の本人確認が行われるため、盗まれても第三者には悪用されにくい。`, answer: false, explain: `Bearer は「持参人」の意味で、<b class="key">持っている人は誰でも使える</b>。盗まれればそのまま悪用されるので、HTTPS 必須・寿命を短く、などの対策が要る。`, lesson: 'c08-l03' },
    { id: 'c08-ox-09', text: `Refresh Token も Bearer だが、送る先は Keycloak だけで、API には送らない。`, answer: true, explain: `Access Token は<b class="key">API に送る</b>Bearer、Refresh Token は<b class="key">Keycloak にしか送らない</b>Bearer である。`, lesson: 'c08-l03' },
    { id: 'c08-ox-10', text: `署名と exp が有効な JWT をローカル検証するだけの API は、ユーザーのログアウト直後でも、そのトークンを即座に無効と判定できる。`, answer: false, explain: `ローカル検証は署名と <code>exp</code> を見るだけなので、<b class="key">失効には exp まで気づかない</b>。即時に反映したいときは Introspection を使う。`, lesson: 'c08-l03' },
    { id: 'c08-ox-11', text: `Introspection は、失効を即時に反映できる代わりに、検証のたびに Keycloak との通信が必要になる。`, answer: true, explain: `Introspection は<b class="key">即時反映</b>できるが<b class="key">毎回通信が必要</b>である。ローカル検証は速く Keycloak に負荷がないが、失効に気づくのは exp になる。`, lesson: 'c08-l03' },
    { id: 'c08-ox-12', text: `まとめ図で、クライアントが ID Token の署名を JWKS で検証し、nonce を照合するのは手順7である。`, answer: true, explain: `手順7で、クライアントは ID Token を<b class="key">JWKS で署名検証</b>し、<code>nonce</code>・<code>iss</code>・<code>aud</code>・<code>exp</code> を確認する。`, lesson: 'c08-l04' },
    { id: 'c08-ox-13', text: `API は JWKS を初回だけ取得してキャッシュし、以降はキャッシュ上の kid に対応する公開鍵で署名を検証する。`, answer: true, explain: `JWKS は<b class="key">初回だけ取得してキャッシュ</b>し、kid で鍵を選んで署名を検証する。あわせて <code>iss</code> / <code>aud</code> / <code>exp</code> / ロールを確認する。`, lesson: 'c08-l04' },
    { id: 'c08-ox-14', text: `認可コードを一度挟むのは、アクセストークンをブラウザの URL (履歴・ログ・Referer) に出さないためである。`, answer: true, explain: `ブラウザには短命の code だけを通し、トークン本体は<b class="key">バックチャネル</b>で受け取る。これで URL にトークンが残らない。`, lesson: 'c08-l05' },
    { id: 'c08-ox-15', text: `Implicit Flow は、トークンを token endpoint へのバックチャネル通信で受け渡すため、Authorization Code Flow より漏れにくい。`, answer: false, explain: `Implicit は<b class="key">URL fragment に直接トークンを載せる</b>ので漏れやすく、廃止方向にある。バックチャネルで受け渡すのは Authorization Code Flow のほうである。`, lesson: 'c08-l05' },
    { id: 'c08-ox-16', text: `認可リクエストには code_verifier そのものを付けて送り、手順6の token リクエストで code_challenge を送る。`, answer: false, explain: `順序が逆である。認可リクエストに付けるのは<b class="key">code_challenge</b>で、<b class="key">code_verifier</b> は token リクエスト (手順6) で送る。`, lesson: 'c08-l05' },
    { id: 'c08-ox-17', text: `state は戻ってきた値を照合して CSRF を防ぐためのもの、nonce は ID Token のリプレイを防ぐためのものである。`, answer: true, explain: `<b class="key">state = CSRF 対策</b> (戻ってきた値を照合)、<b class="key">nonce = ID Token のリプレイ対策</b>である。`, lesson: 'c08-l05' },
    { id: 'c08-ox-18', text: `Keycloak に SSO Cookie が残っている場合、2回目以降のログインではログイン画面が表示されず、すぐ redirect_uri にリダイレクトされる。`, answer: true, explain: `手順4でログインすると <b class="key">SSO Cookie</b> (<code>KEYCLOAK_IDENTITY</code> 等) が作られ、2回目以降は画面なしで即リダイレクトされる。`, lesson: 'c08-l05' },
    { id: 'c08-ox-19', text: `redirect_uri に付いて戻る code は、長期間有効で何度でも使えるトークンそのものである。`, answer: false, explain: `code は<b class="key">ワンタイム・短命 (約1分)</b>の引換券で、トークンそのものではない。token endpoint で Access Token などと交換する。`, lesson: 'c08-l05' },
    { id: 'c08-ox-20', text: `Public client (Client authentication OFF) が token リクエストで code を交換するときは、Authorization: Basic で client secret を付ける。`, answer: false, explain: `<code>Authorization: Basic</code> で secret を付けるのは<b class="key">Confidential (ON)</b> の場合である。Public (OFF) は secret を持たず、代わりに code_verifier を送る。`, lesson: 'c08-l05' },
    { id: 'c08-ox-21', text: `Keycloak は code の交換時に、SHA256(code_verifier) が保存済みの code_challenge と一致するかを検証する。`, answer: true, explain: `手順7の検証項目の一つである。これにより、code を盗まれても<b class="key">verifier を持つ本人しか交換できない</b>。`, lesson: 'c08-l05' },
    { id: 'c08-ox-22', text: `手順9で、クライアントが ID Token の aud として確認するのは API の client_id である。`, answer: false, explain: `ID Token の <code>aud</code> は<b class="key">自分 (クライアント自身) の client_id</b> であることを確認する。API 向けの audience を見るのは Access Token の検証である。`, lesson: 'c08-l05' },
    { id: 'c08-ox-23', text: `SPA 版では、Client App が code と code_verifier を付けて POST /token を行い、access / id / refresh token を受け取る。`, answer: true, explain: `SPA (Public client) は secret を持たず、<b class="key">code + verifier</b> で交換する。受け取ったトークンで API を Bearer 付きで呼ぶ。`, lesson: 'c08-l06' },
    { id: 'c08-ox-24', text: `Confidential な Web アプリ (backend-web) では、token 交換で得たトークンはブラウザに渡され、サーバーはトークンを保持しない。`, answer: false, explain: `トークンは<b class="key">サーバーに置かれ</b>、ブラウザが受け取るのはセッション Cookie だけである。API もサーバーが Bearer 付きで呼ぶ。`, lesson: 'c08-l06' }
  ],
  mc: [
    { id: 'c08-mc-01', stem: `【組合せ型】JWT・JWS・JWE に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `JWT の payload は暗号化されているため、第三者は中身を読めない。` },
        { label: 'B', text: `Keycloak の Access Token と ID Token は、JWS 形式の JWT である。` },
        { label: 'C', text: `RS256 の署名は、header と payload をつないだ値のハッシュを、Keycloak の秘密鍵で署名して作る。` },
        { label: 'D', text: `JWE は署名付きの形式で、Keycloak が通常使うのはこちらである。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× JWT は暗号化ではない。payload は誰でも decode して読めるので、秘密情報を入れてはならない。`,
        `B：○ Access / ID Token は<b class="key">JWS 形式の JWT</b> (署名付き) である。`,
        `C：○ <code>base64url(header).base64url(payload)</code> をハッシュし、それを<b class="key">秘密鍵</b>で署名したものが signature である。`,
        `D：× JWE は<b class="key">暗号化</b>形式で、Keycloak は通常使わない。署名付きの形式は JWS である。`
      ],
      tip: `JWT は書式、署名すれば JWS、暗号化すれば JWE。Keycloak のトークンは署名だけで、中身は誰でも読める。` },
    { id: 'c08-mc-02', stem: `【正誤選択型】kid と JWKS に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        'JWKS は Keycloak が公開する秘密鍵の一覧で、API が署名を作るときに使う。',
        'kid は JWT の header に書かれ、JWKS の中から同じ kid の鍵を探すために使う。',
        'JWKS を取得するには、API 自身の client 認証が必要である。',
        'JWKS に複数の鍵があるのは、旧鍵で署名した古いトークンを検証できなくするためである。',
        '署名の検証には、JWKS のうち use が enc の鍵を使う。'
      ], answer: 2,
      explain: [
        `1：× JWKS は<b class="key">公開鍵</b>の一覧である。署名を作るのは Keycloak の秘密鍵で、API は検証するだけである。`,
        `2：○ header の <code>kid</code> と同じ kid の鍵を JWKS から探して、署名の検証に使う。`,
        `3：× JWKS (<code>/certs</code>) は誰でも取得できる。`,
        `4：× 逆である。鍵が複数あるのは<b class="key">ローテーション</b>のためで、旧鍵で署名した古いトークンも検証できる。`,
        `5：× 署名の検証には <code>use: "sig"</code> の鍵を使う。enc は暗号化用である。`
      ],
      tip: `kid は「何番の印鑑か」、JWKS は「印鑑証明の一覧」。header の番号で、公開の一覧から鍵を選ぶ。` },
    { id: 'c08-mc-03', stem: `【組合せ型】Bearer token と Introspection に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Access Token は Keycloak にだけ送り、API には送らない。` },
        { label: 'B', text: `Bearer token は盗まれるとそのまま悪用されうるため、HTTPS 必須・寿命を短く・URL に入れない、などの対策を取る。` },
        { label: 'C', text: `Introspection はローカル検証より速く、Keycloak に負荷がかからない。` },
        { label: 'D', text: `JWT をローカル検証するだけの API では、トークンの失効に exp まで気づかない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× Access Token は<b class="key">API に送る</b>。Keycloak にしか送らないのは Refresh Token である。`,
        `B：○ Bearer は「持っている人は誰でも使える」ため、盗まれると悪用される。そこで HTTPS・短寿命・URL に入れない・ログに出さない、などで守る。`,
        `C：× 速くて負荷がないのはローカル検証 (JWKS) のほうである。Introspection は<b class="key">毎回通信が必要</b>になる。`,
        `D：○ ローカル検証は署名と <code>exp</code> を見るだけなので、失効の反映は<b class="key">exp まで</b>気づかない。`
      ],
      tip: `Bearer は持参人式なので、盗まれたら終わり。だから短寿命と HTTPS で守り、即時失効が要るなら Introspection を足す。` },
    { id: 'c08-mc-04', stem: `【正誤選択型】1回のログインから API 呼び出しまでの流れに関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        'アプリは認可リクエストの前に state・nonce・code_verifier を用意し、code_challenge は code_verifier を SHA256 でハッシュして作る。',
        'アプリは ID Token を JWKS で署名検証し、nonce を照合する。',
        'API は Access Token の署名を、kid に対応する JWKS の公開鍵で検証し、iss・aud・exp やロールを確認する。',
        'API は、即時失効を反映したいときに、introspection を使うことができる。',
        'API は Access Token を検証するために、Keycloak の秘密鍵を使って signature を確認する。'
      ], answer: 5,
      explain: [
        `1：○ 手順0で state・nonce・code_verifier を作り、challenge は verifier の SHA256 から求める。`,
        `2：○ 手順7で、ID Token を<b class="key">JWKS</b> で署名検証し、nonce を照合する。`,
        `3：○ API は kid → JWKS の公開鍵で署名を検証し、<code>iss</code> / <code>aud</code> / <code>exp</code> / ロールを確認する。`,
        `4：○ option として <code>POST /token/introspect</code> で即時失効を反映できる。`,
        `5：× 検証に使うのは<b class="key">公開鍵</b> (JWKS) である。秘密鍵は署名を作る Keycloak が使うものである。`
      ],
      tip: `署名は秘密鍵 (Keycloak)、検証は公開鍵 (JWKS)。検証する側が秘密鍵を使うことはない。` },
    { id: 'c08-mc-05', stem: `【組合せ型】state・nonce・PKCE に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `state は、戻ってきた値を照合する CSRF 対策である。` },
        { label: 'B', text: `nonce は、認可コードを盗まれても交換できなくするために使う。` },
        { label: 'C', text: `code_challenge は認可リクエストに付け、code_verifier は token リクエストに付ける。` },
        { label: 'D', text: `Keycloak は、認可リクエストを受けた時点で SHA256(code_verifier) と code_challenge を照合する。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ <b class="key">state</b> は戻ってきた値を保存済みの値と照合し、CSRF を防ぐ。`,
        `B：× nonce は <b class="key">ID Token のリプレイ対策</b>である。code を盗まれても交換できなくするのは PKCE である。`,
        `C：○ 認可リクエストには challenge、token リクエスト (code の交換) には verifier を付ける。`,
        `D：× 照合は<b class="key">code の交換時</b> (手順7) に行う。認可リクエストの時点では challenge を保存するだけである。`
      ],
      tip: `state は「戻りの本人確認」、nonce は「ID Token の使い回し防止」、PKCE は「code を盗まれても交換させない」。守るものが違う。` },
    { id: 'c08-mc-06', stem: `【正誤選択型】Authorization Code Flow に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        '認可レスポンスで返る code は、ワンタイム・短命の引換券であり、トークンそのものではない。',
        '認可レスポンスで返る code は、そのまま API に送れる Access Token である。',
        'Implicit Flow は URL fragment にトークンを載せないため、Authorization Code Flow より漏れにくい。',
        'Public client (Client authentication OFF) の token リクエストには、Authorization: Basic で client secret を付ける。',
        'Keycloak は code の交換時に、redirect_uri が認可リクエスト時と同一かを確認しない。'
      ], answer: 1,
      explain: [
        `1：○ code は<b class="key">ワンタイム・短命 (約1分)</b> の引換券で、token endpoint で Access Token などと交換する。`,
        `2：× code はトークンそのものではない。API に送るのは、交換して得た Access Token である。`,
        `3：× Implicit は URL fragment に直接トークンを載せるため漏れやすく、廃止方向にある。`,
        `4：× Basic で secret を付けるのは Confidential (ON) の場合である。Public は code_verifier を送る。`,
        `5：× 手順7で、<code>redirect_uri</code> が認可リクエスト時と<b class="key">同一か</b>を確認する。`
      ],
      tip: `code は「引換券」であってトークンではない。引換えは直接通信で行い、そこで verifier や secret を確かめる。` },
    { id: 'c08-mc-07', stem: `【組合せ型】Keycloak が token endpoint で code を受け取ったときに検証する事柄に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `ID Token の nonce が、認可リクエストに付けた値と一致するか。` },
        { label: 'B', text: `Access Token の exp が切れていないか。` },
        { label: 'C', text: `SHA256(code_verifier) が、保存済みの code_challenge と一致するか。` },
        { label: 'D', text: `(Client authentication が ON の場合) client secret が正しいか。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× nonce を照合するのは、<b class="key">クライアント</b>が ID Token を受け取ったあと (手順9) である。`,
        `B：× code の交換時点では、まだ Access Token は発行されていない。確認するのは code が有効・未使用かである。`,
        `C：○ PKCE の検証として、verifier のハッシュと保存済みの challenge を照合する。`,
        `D：○ ON (Confidential) の場合は、client secret が正しいかも検証する。`
      ],
      tip: `手順7の4項目は「code・redirect_uri・verifier・secret」。nonce は ID Token を受け取る側 (クライアント) の仕事である。` },
    { id: 'c08-mc-08', stem: `【正誤選択型】SPA 版と Confidential Web 版の Authorization Code Flow に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        'SPA 版では、token の交換に code と code_verifier を使う。',
        'Web 版 (backend-web) では、token の交換に Authorization: Basic (client:secret) を使う。',
        'Web 版では、トークンはブラウザの Cookie に保存され、サーバーはトークンを保持しない。',
        'Web 版では、サーバーが Bearer 付きで API を呼ぶ。',
        'Web 版では、ブラウザが受け取るのはセッション Cookie である。'
      ], answer: 3,
      explain: [
        `1：○ SPA は Public client で、<b class="key">code + verifier</b> で交換する。`,
        `2：○ Confidential は token 交換で<b class="key">secret</b> (Basic) を使う。`,
        `3：× トークンは<b class="key">サーバー</b>に置かれ、ブラウザには渡らない。ブラウザが持つのはセッション Cookie だけである。`,
        `4：○ サーバーが <code>Authorization: Bearer</code> 付きで API を呼ぶ。`,
        `5：○ ブラウザに渡るのは <code>Set-Cookie: session</code> である。`
      ],
      tip: `Web 版はトークンを「サーバーの金庫」に置き、ブラウザには「整理券 (セッション Cookie)」だけを渡す。` },
    { id: 'c08-mc-09', stem: `【組合せ型】API 側の JWT 署名検証に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `検証に使う鍵は、JWT の signature 部分に書かれた kid で決まる。` },
        { label: 'B', text: `API は JWKS をキャッシュしておき、手元に無い kid のトークンが来たら JWKS を再取得して探す。` },
        { label: 'C', text: `鍵のローテーション後は、旧鍵で署名した古いトークンは検証できなくなる。` },
        { label: 'D', text: `JWKS の n と e は、RSA 公開鍵の本体 (数値) である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× kid が書かれているのは signature ではなく<b class="key">header</b>である。`,
        `B：○ キャッシュに無ければ JWKS を再取得して、kid に対応する鍵を探す。`,
        `C：× 旧鍵で署名した古いトークンも検証できる。鍵が複数載るのはそのためのローテーションである。`,
        `D：○ <code>n</code>, <code>e</code> は<b class="key">RSA 公開鍵の本体</b> (数値) である。`
      ],
      tip: `鍵が増えても kid で選べるから、ローテーションしても古いトークンは検証でき、未知の kid なら JWKS を取り直す。` }
  ]
});

DATA.chapters.push({
  no: 9, title: `その他のフロー`,
  lessons: [
    { id: 'c09-l01', title: `Client Credentials Flow`, pages: [
      { id: 'c09-l01-p01', title: `Client Credentials: ユーザー不在のサーバー間通信`,
        html: `<h4>用途</h4><p><b class="key">ユーザー不在のサーバー間</b> (バッチ、マイクロサービス間) で使うフローである。ログイン画面もユーザー操作もなく、client 自身が自分の資格でトークンを取る。</p><h4>準備 (Client auth ON 必須)</h4><ul><li><b class="key">Client Authentication = ON</b></li><li><b class="key">Service accounts roles = ON</b></li><li>Service Account Roles タブで role を付与する</li></ul><h4>リクエスト</h4><pre>curl -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -u 'batch-job:s3cr3t' \\
  -d grant_type=client_credentials \\
  -d scope=openid</pre><p><code>-u 'batch-job:s3cr3t'</code> は client の ID と secret である。ユーザーの ID/パスワードは登場しない。</p><span class="trap">Client authentication が ON であることが必須条件である。secret を持てない Public client では使えない。</span>`,
        oxIds: ['c09-ox-01', 'c09-ox-02'] },
      { id: 'c09-l01-p02', title: `返るトークン・claim の特徴・シーケンス`,
        html: `<h4>レスポンス</h4><p>返るのは <b class="key">access_token のみ</b>である。refresh_token と id_token は基本的に付かない。</p><h4>claim の特徴</h4><ul><li><code>sub</code> = <code>service-account-batch-job</code> ユーザーの UUID</li><li><code>preferred_username</code> = <code>service-account-batch-job</code></li><li><code>azp</code> = <code>batch-job</code> (<code>clientId</code> / <code>client_id</code> claim が入ることも)</li></ul><p><code>aud</code> が足りなければ、<b class="key">Audience Mapper</b> で <code>backend-api</code> を追加する。</p><h4>シーケンス</h4><pre>Batch (batch-job)                 Keycloak                    API (backend-api)
      │                              │                              │
      │ POST /token                  │                              │
      │  Authorization: Basic (client:secret)                       │
      │  grant_type=client_credentials                              │
      │─────────────────────────────&gt;│                              │
      │                              │ verify client + secret       │
      │                              │ load Service Account roles   │
      │&lt;── access_token (no refresh/id token)                       │
      │                              │                              │
      │ GET /items  Authorization: Bearer &lt;access_token&gt;            │
      │────────────────────────────────────────────────────────────&gt;│
      │                              │   verify sign / iss / aud    │
      │&lt;──────────────────────────── JSON ──────────────────────────│
      │ (expired -&gt; just call POST /token again; no user involved)  │</pre>`,
        oxIds: ['c09-ox-03', 'c09-ox-04'] }
    ] },
    { id: 'c09-l02', title: `Refresh Token Flow`, pages: [
      { id: 'c09-l02-p01', title: `Refresh Token で Access Token を取り直す`,
        html: `<h4>目的</h4><p><b class="key">Access Token が失効したとき</b>に、ユーザーに再ログインさせず再取得するためのフローである。Refresh Token を token endpoint に送る。</p><pre>curl -X POST .../token \\
  -d grant_type=refresh_token \\
  -d client_id=frontend-spa \\
  -d refresh_token=eyJhbGciOiJIUzUx...</pre><ul><li>送り先は Keycloak の token endpoint であり、API ではない</li><li><b class="key">Confidential</b> は client secret も必要である</li></ul><span class="trap">Public (frontend-spa) は client_id だけで送れるが、Confidential は secret も付ける。</span>`,
        oxIds: ['c09-ox-05', 'c09-ox-06'] },
      { id: 'c09-l02-p02', title: `Refresh Token Rotation と invalid_grant`,
        html: `<h4>Refresh Token Rotation</h4><p>Realm setting の <b class="key">「Revoke Refresh Token」を ON</b> にすると、Refresh Token が<b class="key">使い捨て</b>になる。Public client は、新しい Refresh Token を<b class="key">毎回</b>受け取る。</p><h4>Refresh が失敗したとき</h4><p>Refresh が失敗すると <code>invalid_grant</code> が返る。メッセージは <code>"Session not active"</code> や <code>"Token is not active"</code> である。</p><p>こうなったら、リトライせず<b class="key">再ログインへ</b>進める。ユーザーを <code>/auth</code> に誘導して、認証し直してもらう。</p><span class="trap">Refresh Token があれば永続的に更新できるわけではない。Keycloak 側のセッションが生きていることが前提である。</span>`,
        oxIds: ['c09-ox-07', 'c09-ox-08'] },
      { id: 'c09-l02-p03', title: `Refresh のシーケンス`,
        html: `<h4>401 から再取得、そして再ログインまで</h4><pre>Client App                         Keycloak                     API
    │ GET /items (Bearer old token) ─────────────────────────────&gt;│
    │&lt;──────────────── 401 (token expired) ────────────────────────│
    │                                 │                            │
    │ POST /token                     │                            │
    │  grant_type=refresh_token       │                            │
    │  client_id (+secret if ON)      │                            │
    │  refresh_token=...              │                            │
    │────────────────────────────────&gt;│ check session is alive     │
    │                                 │ (Rotation ON: old RT revoked)
    │&lt;── new access_token (+ new refresh_token) ──                 │
    │ GET /items (Bearer new token) ──────────────────────────────&gt;│
    │&lt;───────────────────────── 200 JSON ──────────────────────────│
    │                                 │                            │
    │ [if RT expired / session ended]                              │
    │&lt;── 400 invalid_grant ("Session not active")                 │
    │ -&gt; redirect user to /auth for re-login                       │</pre><h4>読み方</h4><ul><li>API が <b class="key">401 (token expired)</b> を返す</li><li>Client App が <code>grant_type=refresh_token</code> で <code>POST /token</code> し、Keycloak が<b class="key">セッションが生きているか</b>を確認する</li><li>Rotation ON なら古い Refresh Token は失効し、新しいものが返る</li><li>セッションが終わっていれば <code>400 invalid_grant</code> となり、再ログインへ進む</li></ul>`,
        oxIds: ['c09-ox-09'] }
    ] },
    { id: 'c09-l03', title: `Password Grant (非推奨) と Device Grant`, pages: [
      { id: 'c09-l03-p01', title: `Password Grant (Direct Access Grants): なぜ非推奨か`,
        html: `<h4>仕組み</h4><p><b class="key">Resource Owner Password Credentials</b> (Direct Access Grants) は、アプリがユーザーの ID/パスワードを<b class="key">直接受け取り</b>、token endpoint に送るフローである。</p><pre>curl -X POST .../token \\
  -d grant_type=password -d client_id=frontend-spa \\
  -d username=taro -d password=pass1234 -d scope=openid</pre><h4>なぜ非推奨か</h4><ul><li>OAuth 2.1 で廃止された。<b class="key">テスト・移行用途のみ</b></li><li><b class="key">MFA / SSO / ソーシャルログイン</b>が使えない</li></ul><pre>User          App (login form)               Keycloak
 │ id/pw input ───&gt;│                            │
 │                 │ POST /token                │
 │                 │  grant_type=password       │
 │                 │  username, password        │
 │                 │───────────────────────────&gt;│ verify id/pw
 │                 │                            │ (no login screen, no MFA/SSO)
 │                 │&lt;── access / refresh token ─│
 │&lt;── logged in ───│                            │
 ※ the app sees the user's password itself -&gt; why this flow is deprecated</pre><span class="trap">Keycloak のログイン画面を経由しないので、アプリがパスワードそのものを見ることになる。これが非推奨の理由である。</span>`,
        oxIds: ['c09-ox-10', 'c09-ox-11'] },
      { id: 'c09-l03-p02', title: `Device Authorization Grant の手順`,
        html: `<h4>用途</h4><p><b class="key">TV、CLI、IoT</b> など、ブラウザでの入力が困難なデバイスで使う。ログインはデバイスではなく、別の端末で行う。</p><h4>手順</h4><ol><li>デバイスが <code>POST /auth/device</code> (<code>client_id=cli-tool</code>) を呼ぶ</li><li>デバイスの画面に「別端末で <code>verification_uri</code> を開き、<code>WDJB-MJHT</code> を入力」と表示する</li><li>ユーザーがスマホ等でログインし、承認する</li><li>デバイスは <code>interval</code> 秒ごとに token endpoint を<b class="key">ポーリング</b>する</li></ol><p>手順1のレスポンス例は次のとおり。</p><pre>{ "device_code": "GmRh...", "user_code": "WDJB-MJHT",
  "verification_uri": "http://localhost:8080/realms/myrealm/device",
  "verification_uri_complete": "http://localhost:8080/realms/myrealm/device?user_code=WDJB-MJHT",
  "expires_in": 600, "interval": 5 }</pre><p>手順4のポーリングでは、次のパラメータを送る。</p><pre>grant_type=urn:ietf:params:oauth:grant-type:device_code
&amp;device_code=GmRh...&amp;client_id=cli-tool</pre>`,
        oxIds: ['c09-ox-12', 'c09-ox-13'] },
      { id: 'c09-l03-p03', title: `Device Grant のシーケンスとポーリングのエラー`,
        html: `<h4>ポーリング中のエラー</h4><ul><li>承認前: <code>authorization_pending</code></li><li>早すぎる: <code>slow_down</code></li></ul><h4>シーケンス</h4><pre>CLI/TV (device)         Keycloak              User's phone/PC
     │ POST /auth/device    │                       │
     │  client_id=cli-tool  │                       │
     │─────────────────────&gt;│                       │
     │&lt;─ device_code, user_code=WDJB-MJHT,          │
     │   verification_uri, interval=5               │
     │ show on screen:                              │
     │  "Open verification_uri, enter WDJB-MJHT"    │
     │                      │&lt;── open verification_uri
     │                      │&lt;── enter user_code ───│
     │                      │&lt;── login + approve ───│
     │ POST /token (device_code)  every 5 sec       │
     │─────────────────────&gt;│                       │
     │&lt;─ 400 authorization_pending (not yet)        │
     │ ... repeat ...       │                       │
     │ POST /token (device_code)                    │
     │─────────────────────&gt;│ approved!             │
     │&lt;─ access / refresh token                     │</pre><p>ユーザーが承認するまでは <code>400 authorization_pending</code> が返り、承認後のポーリングで access / refresh token が返る。</p>`,
        oxIds: ['c09-ox-14'] }
    ] },
    { id: 'c09-l04', title: `Token Exchange と Logout`, pages: [
      { id: 'c09-l04-p01', title: `Token Exchange: 別の audience のトークンに交換する`,
        html: `<h4>何をするフローか</h4><p>あるトークンを、<b class="key">別の audience / 別ユーザー / 別 IdP 用</b>のトークンに交換する。v26.2 で <b class="key">Standard Token Exchange</b> (RFC 8693、内部↔内部) が正式対応した。</p><pre>curl -X POST .../token \\
  -u 'service-a:secret' \\
  -d grant_type=urn:ietf:params:oauth:grant-type:token-exchange \\
  -d subject_token=eyJ... \\
  -d subject_token_type=urn:ietf:params:oauth:token-type:access_token \\
  -d audience=service-b</pre><h4>用途</h4><p>マイクロサービスの<b class="key">下流呼び出し (On-Behalf-Of)</b> である。Service A がユーザーから受け取ったトークンを、Service B 向けのトークンに交換する。</p>`,
        oxIds: ['c09-ox-15', 'c09-ox-16'] },
      { id: 'c09-l04-p02', title: `Token Exchange のシーケンスを読む`,
        html: `<h4>Service A が Service B を呼ぶまで</h4><pre>Service A (azp)                  Keycloak                    Service B
     │ (holds user's access token: aud=service-a)               │
     │ POST /token                  │                           │
     │  Authorization: Basic (service-a:secret)                 │
     │  grant_type=token-exchange   │                           │
     │  subject_token=&lt;user token&gt;  │                           │
     │  audience=service-b          │                           │
     │─────────────────────────────&gt;│ check: A may exchange?    │
     │                              │ check: subject_token valid│
     │&lt;── new access_token (aud=service-b, sub=same user)       │
     │ GET /data  Authorization: Bearer &lt;new token&gt;             │
     │─────────────────────────────────────────────────────────&gt;│
     │&lt;──────────────────────── JSON ───────────────────────────│</pre><ul><li>Service A は、ユーザーの Access Token (<code>aud=service-a</code>) を持っている</li><li>Service A は自分の client 認証 (Basic) を付けて、<code>subject_token</code> と <code>audience=service-b</code> を送る</li><li>Keycloak は「A に交換を許すか」と「subject_token が有効か」を確認する</li><li>新しい Access Token は <b class="key">aud=service-b、sub は同じユーザー</b>である</li></ul>`,
        oxIds: ['c09-ox-17'] },
      { id: 'c09-l04-p03', title: `Logout の3つの方式`,
        html: `<h4>RP-Initiated Logout (ブラウザ経由)</h4><pre>GET /realms/myrealm/protocol/openid-connect/logout
  ?id_token_hint=eyJ...
  &amp;post_logout_redirect_uri=http://localhost:3000/
  &amp;state=abc</pre><ul><li><code>id_token_hint</code> か <code>client_id</code> が必要 (v18+)</li><li><code>post_logout_redirect_uri</code> は「<b class="key">Valid post logout redirect URIs</b>」に登録が必須</li></ul><h4>Back-Channel Logout</h4><p>Keycloak → アプリの<b class="key">サーバー</b>へ、<code>logout_token</code> (JWT) を POST する。</p><h4>Front-Channel Logout</h4><p><b class="key">iframe</b> 経由で通知する。</p><h4>Refresh Token を直接失効</h4><p><code>POST /logout</code> に refresh_token を送る。</p>`,
        oxIds: ['c09-ox-18', 'c09-ox-19'] },
      { id: 'c09-l04-p04', title: `Logout のシーケンス (A / B / C)`,
        html: `<h4>3方式の流れ</h4><pre>[A] RP-Initiated Logout (browser)
User/Browser          App                    Keycloak
    │ click logout      │                        │
    │──────────────────&gt;│ clear app session      │
    │&lt;─ 302 /logout?id_token_hint=..&amp;post_logout_redirect_uri=..
    │────────────── GET /logout ───────────────&gt;│ end SSO session
    │                                            │ (other apps' sessions are notified, see B/C)
    │&lt;─ 302 post_logout_redirect_uri ────────────│
    │──────────────────&gt;│ show "logged out"      │

[B] Back-Channel Logout (Keycloak -&gt; app server)
Keycloak                         Other App (server)
    │ POST backchannel_logout_url      │
    │  logout_token (JWT: sid, sub)    │
    │─────────────────────────────────&gt;│ find session by sid -&gt; destroy
    │&lt;──────────────── 200 ────────────│

[C] Front-Channel Logout
Browser(in Keycloak logout page)   Other App
    │ iframe GET frontchannel_logout_url ─&gt;│ destroy session (Cookie)</pre><ul><li>[A] は、アプリがブラウザを Keycloak の <code>/logout</code> に誘導し、<b class="key">SSO session を終了</b>させる。他のアプリへの通知は B / C で行う</li><li>[B] は、Keycloak が他のアプリのサーバーに <code>logout_token</code> を POST し、アプリが <code>sid</code> でセッションを探して破棄する</li><li>[C] は、Keycloak のログアウト画面の iframe が、他のアプリの URL を呼んで Cookie のセッションを破棄させる</li></ul>`,
        oxIds: ['c09-ox-20'] }
    ] },
    { id: 'c09-l05', title: `SAML SSO と Identity Brokering`, pages: [
      { id: 'c09-l05-p01', title: `SAML SSO と OIDC の対応関係`,
        html: `<h4>SP-initiated の流れ</h4><p>SP (アプリ) が <b class="key">AuthnRequest</b> を Keycloak (IdP) に送る → ユーザーがログイン → Keycloak が<b class="key">SAMLResponse</b> (署名付き XML) を SP に POST する。</p><h4>OIDC との対応</h4><table><tr><th>SAML</th><th>OIDC</th></tr><tr><td><b class="key">Assertion</b></td><td>≈ ID Token</td></tr><tr><td><b class="key">Entity ID</b></td><td>≈ client_id</td></tr><tr><td><b class="key">ACS URL</b></td><td>≈ redirect_uri</td></tr></table><pre>User/Browser           SP (app)                Keycloak (IdP)
    │ access protected page │                       │
    │──────────────────────&gt;│                       │
    │&lt;─ 302 to IdP SSO URL + SAMLRequest (AuthnRequest)
    │────────────── GET /protocol/saml?SAMLRequest ─&gt;│
    │&lt;─────────────── login page ───────────────────│
    │── username/password ─────────────────────────&gt;│
    │&lt;─ HTML form w/ SAMLResponse (signed Assertion) ─│
    │── POST SAMLResponse to ACS URL ──&gt;│           │
    │                       │ verify signature,     │
    │                       │ read Assertion        │
    │&lt;─ session established ─│                      │</pre>`,
        oxIds: ['c09-ox-21', 'c09-ox-22'] },
      { id: 'c09-l05-p02', title: `Identity Brokering: 外部 IdP でログインする`,
        html: `<h4>流れ</h4><p>アプリ → Keycloak → (Google 等へ転送) → Google でログイン → Keycloak に戻る → <b class="key">Keycloak がアプリ用トークンを新規発行</b>する。アプリは Keycloak しか知らなくてよい。</p><ul><li><b class="key">First Login Flow</b> で、ユーザーを自動作成したり既存ユーザーとリンクしたりする</li><li><b class="key">Identity Provider Mapper</b> で、Google の属性を Keycloak のユーザー属性にマップする</li></ul><h4>シーケンス</h4><pre>User/Browser         App          Keycloak (broker)          Google (external IdP)
    │ click login      │                │                         │
    │─────────────────&gt;│ 302 /auth      │                         │
    │──────────────────────────────────&gt;│                         │
    │&lt;─ login page ("Sign in with Google" button) ─│              │
    │── choose Google ─────────────────&gt;│                         │
    │&lt;─ 302 Google /auth?client_id=keycloak&amp;redirect_uri=KC/broker/google/endpoint
    │───────────────────────────────────────────────────────────&gt;│
    │&lt;───────────────────── Google login page ───────────────────│
    │── Google id/pw (+consent) ────────────────────────────────&gt;│
    │&lt;─ 302 KC/broker/google/endpoint?code=G-code ───────────────│
    │──────────────────────────────────&gt;│ POST Google /token (G-code)
    │                                   │──────────────────────────&gt;│
    │                                   │&lt;─ Google id_token ───────│
    │                                   │ First login flow:        │
    │                                   │  create / link KC user   │
    │                                   │ IdP Mapper: attrs -&gt; user│
    │&lt;─ 302 app redirect_uri?code=KC-code ──│                      │
    │─────────────────&gt;│ POST /token (KC-code)                     │
    │                  │──────────────────&gt;│ issue KC's OWN tokens │
    │                  │&lt;─ access/id/refresh (iss=Keycloak)        │
    │      ※ the app only talks to Keycloak; Google's token never reaches the app</pre><span class="trap">アプリに届くのは Keycloak 自身が発行したトークン (<code>iss</code> = Keycloak) であり、Google のトークンはアプリに届かない。</span>`,
        oxIds: ['c09-ox-23', 'c09-ox-24'] }
    ] }
  ],
  ox: [
    { id: 'c09-ox-01', text: `Client Credentials Flow を使うには、client の Client Authentication を ON にし、Service accounts roles も ON にする。`, answer: true, explain: `Client Credentials は <b class="key">Client auth ON 必須</b>で、あわせて <b class="key">Service accounts roles ON</b> にして、Service Account Roles タブで role を付与する。`, lesson: 'c09-l01' },
    { id: 'c09-ox-02', text: `Client Credentials Flow は、ユーザーがログイン画面で認証したあと、そのユーザーの代わりに API を呼ぶために使う。`, answer: false, explain: `用途は<b class="key">ユーザー不在のサーバー間</b> (バッチ、マイクロサービス間) である。ユーザーの認証は伴わず、client 自身の資格 (ID + secret) でトークンを取る。`, lesson: 'c09-l01' },
    { id: 'c09-ox-03', text: `Client Credentials で取った Access Token が期限切れになったら、ユーザー操作は要らず、また POST /token を呼べばよい。`, answer: true, explain: `シーケンス図のとおり、期限切れなら<b class="key">もう一度 POST /token を呼ぶだけ</b>でよい。ユーザーは介在しない (refresh_token は基本的に返らない)。`, lesson: 'c09-l01' },
    { id: 'c09-ox-04', text: `Client Credentials の Access Token では、sub に batch-job という client_id がそのまま入り、azp には service-account ユーザーの UUID が入る。`, answer: false, explain: `逆である。<code>sub</code> は <b class="key">service-account-batch-job ユーザーの UUID</b>、<code>azp</code> は <code>batch-job</code> (client) である。`, lesson: 'c09-l01' },
    { id: 'c09-ox-05', text: `Confidential client が Refresh Token で Access Token を取り直すときは、client secret も必要になる。`, answer: true, explain: `Refresh Token Flow でも、<b class="key">Confidential は secret も必要</b>である。Public (frontend-spa の例) は client_id だけで送る。`, lesson: 'c09-l02' },
    { id: 'c09-ox-06', text: `Refresh Token Flow では、Refresh Token を API に送り、API が新しい Access Token を発行する。`, answer: false, explain: `新しい Access Token を発行するのは <b class="key">Keycloak</b> である。Refresh Token は Keycloak の token endpoint (<code>grant_type=refresh_token</code>) に送り、API には送らない。`, lesson: 'c09-l02' },
    { id: 'c09-ox-07', text: `Realm setting の「Revoke Refresh Token」を ON にすると Refresh Token が使い捨てになり、Public client は新しい Refresh Token を毎回受け取る。`, answer: true, explain: `これが <b class="key">Refresh Token Rotation</b> である。使った Refresh Token は失効し、新しいものが返る。`, lesson: 'c09-l02' },
    { id: 'c09-ox-08', text: `Refresh で invalid_grant が返ったら、同じ Refresh Token でリトライを続ければ、いずれ新しい Access Token が取れる。`, answer: false, explain: `<code>invalid_grant</code> (<code>"Session not active"</code> など) は、セッションが終わっているなど Refresh Token が使えない状態である。リトライではなく<b class="key">再ログイン</b>へ進める。`, lesson: 'c09-l02' },
    { id: 'c09-ox-09', text: `API から 401 (token expired) を受けたクライアントは、refresh_token で POST /token を行い、得た新しい Access Token で API を呼び直す。`, answer: true, explain: `図のとおり、<b class="key">401 → refresh_token で再取得 → 新しい Bearer で再呼び出し</b>という流れになる。`, lesson: 'c09-l02' },
    { id: 'c09-ox-10', text: `Password Grant では Keycloak がログイン画面を表示するため、MFA や SSO も利用できる。`, answer: false, explain: `Password Grant は<b class="key">ログイン画面を経由しない</b>ので、MFA / SSO / ソーシャルログインが使えない。アプリが ID/パスワードを直接送る。`, lesson: 'c09-l03' },
    { id: 'c09-ox-11', text: `Password Grant が非推奨なのは、アプリがユーザーのパスワードそのものを受け取ることになるためである。`, answer: true, explain: `図の注記のとおり、<b class="key">アプリがユーザーのパスワードそのものを見る</b>ことが、このフローが非推奨とされる理由である。OAuth 2.1 で廃止され、テスト・移行用途のみ。`, lesson: 'c09-l03' },
    { id: 'c09-ox-12', text: `Device Grant では、デバイスが user_code を画面に表示し、ユーザーが別の端末で verification_uri を開いて、コードを入力して承認する。`, answer: true, explain: `ブラウザ入力が困難な TV・CLI・IoT のために、<b class="key">ログインと承認を別端末</b> (スマホ等) に任せる仕組みである。`, lesson: 'c09-l03' },
    { id: 'c09-ox-13', text: `Device Grant では、ユーザーが承認すると、Keycloak がデバイスに向けて自動でトークンを送り込む。`, answer: false, explain: `デバイスが <code>interval</code> 秒ごとに token endpoint を<b class="key">ポーリング</b>し、承認後のポーリングでトークンを受け取る。Keycloak からの送り込みではない。`, lesson: 'c09-l03' },
    { id: 'c09-ox-14', text: `Device Grant のポーリングで、ユーザーの承認前には slow_down が返り、問い合わせが早すぎるときには authorization_pending が返る。`, answer: false, explain: `入れ替わっている。<b class="key">承認前は authorization_pending</b>、<b class="key">早すぎるときは slow_down</b> である。`, lesson: 'c09-l03' },
    { id: 'c09-ox-15', text: `Token Exchange は、マイクロサービスが受け取ったユーザーのトークンを、下流サービス向け (別 audience) のトークンに交換する用途に使える。`, answer: true, explain: `これが<b class="key">下流呼び出し (On-Behalf-Of)</b> の用途である。あるトークンを別の audience 用のトークンに交換する。`, lesson: 'c09-l04' },
    { id: 'c09-ox-16', text: `v26.2 で正式対応した Standard Token Exchange (RFC 8693) は、Keycloak 内部のトークンと外部 IdP のトークンの交換を対象にしている。`, answer: false, explain: `v26.2 で正式対応した Standard Token Exchange (RFC 8693) は<b class="key">内部↔内部</b>の交換である。外部 IdP のトークンとの交換とは、取り違えない。`, lesson: 'c09-l04' },
    { id: 'c09-ox-17', text: `Token Exchange で得た新しい Access Token は aud が service-b になり、sub は service-a の service account になる。`, answer: false, explain: `新しいトークンは <b class="key">aud=service-b、sub は元と同じユーザー</b>である。ユーザーの身元を保ったまま、下流サービス向けにトークンを作り直す。`, lesson: 'c09-l04' },
    { id: 'c09-ox-18', text: `RP-Initiated Logout で使う post_logout_redirect_uri は、Client の「Valid post logout redirect URIs」に登録しておく必要がある。`, answer: true, explain: `登録は<b class="key">必須</b>である。あわせて <code>id_token_hint</code> か <code>client_id</code> が必要 (v18+) である。`, lesson: 'c09-l04' },
    { id: 'c09-ox-19', text: `Back-Channel Logout は、ブラウザの iframe を経由して、Keycloak がアプリにログアウトを通知する方式である。`, answer: false, explain: `iframe 経由は <b class="key">Front-Channel</b> である。Back-Channel は Keycloak が<b class="key">アプリのサーバーへ logout_token (JWT) を POST</b> する。`, lesson: 'c09-l04' },
    { id: 'c09-ox-20', text: `Back-Channel Logout では、アプリのサーバーが logout_token の sid からセッションを探して破棄する。`, answer: true, explain: `図のとおり、logout_token には <code>sid</code> / <code>sub</code> が入っており、アプリは <b class="key">sid でセッションを探して破棄</b>する。`, lesson: 'c09-l04' },
    { id: 'c09-ox-21', text: `SAML の ACS URL は、OIDC の redirect_uri に対応する。`, answer: true, explain: `対応は <b class="key">ACS URL ≈ redirect_uri</b>、Entity ID ≈ client_id、Assertion ≈ ID Token である。SAMLResponse はこの ACS URL に POST される。`, lesson: 'c09-l05' },
    { id: 'c09-ox-22', text: `OIDC の ID Token に相当するものは、SAML では Entity ID である。`, answer: false, explain: `ID Token に相当するのは <b class="key">Assertion</b> である。Entity ID は client_id に相当する。`, lesson: 'c09-l05' },
    { id: 'c09-ox-23', text: `Identity Brokering では、Google が発行した id_token がそのままアプリに渡され、アプリは Google のトークンを検証する。`, answer: false, explain: `アプリには <b class="key">Keycloak 自身が新規発行したトークン</b> (iss = Keycloak) が届く。Google のトークンはアプリに届かず、アプリは Keycloak としか話さない。`, lesson: 'c09-l05' },
    { id: 'c09-ox-24', text: `First Login Flow は、外部 IdP で初めてログインしたユーザーを Keycloak に自動作成したり、既存ユーザーとリンクしたりするために使う。`, answer: true, explain: `<b class="key">First Login Flow</b> が、ユーザーの自動作成または既存ユーザーとのリンクを担う。属性のマップは Identity Provider Mapper の役割である。`, lesson: 'c09-l05' }
  ],
  mc: [
    { id: 'c09-mc-01', stem: `【組合せ型】Client Credentials Flow に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `レスポンスには、access_token のほかに refresh_token と id_token が標準で含まれる。` },
        { label: 'B', text: `ユーザー不在のサーバー間通信で使い、Client Authentication と Service accounts roles を ON にする。` },
        { label: 'C', text: `Access Token の sub には、バッチを実行した人間ユーザーの UUID が入る。` },
        { label: 'D', text: `Access Token の aud が足りないときは、Audience Mapper で backend-api を追加できる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× 返るのは<b class="key">access_token のみ</b>で、refresh_token・id_token は基本的に付かない。`,
        `B：○ 用途はユーザー不在のサーバー間で、<b class="key">Client auth ON</b> と <b class="key">Service accounts roles ON</b> が準備として必要である。`,
        `C：× ユーザーは不在である。sub は <code>service-account-batch-job</code> ユーザーの UUID である。`,
        `D：○ aud が足りなければ <b class="key">Audience Mapper</b> で <code>backend-api</code> を追加する。`
      ],
      tip: `Client Credentials は「ユーザーがいない」ので、人間ではなく service account が主語になる。` },
    { id: 'c09-mc-02', stem: `【正誤選択型】Refresh Token Flow に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        'Refresh Token は API に送り、API が Keycloak に取り次いで新しい Access Token を得る。',
        '「Revoke Refresh Token」を ON にすると、Refresh Token は何度でも再利用できるようになる。',
        'Refresh が invalid_grant で失敗したら、リトライせずにユーザーを再ログインへ進める。',
        'Confidential client は、client secret なしで Refresh できる。',
        'Refresh Token が有効であれば、Keycloak 側のセッションが終了していても Access Token を取得できる。'
      ], answer: 3,
      explain: [
        `1：× Refresh Token は <b class="key">Keycloak の token endpoint</b> に送る。API には送らない。`,
        `2：× 逆である。ON にすると Refresh Token は<b class="key">使い捨て</b>になる。`,
        `3：○ <code>invalid_grant</code> (<code>"Session not active"</code> など) は<b class="key">再ログインへ</b>進める合図である。`,
        `4：× Confidential は <b class="key">secret も必要</b>である。`,
        `5：× Keycloak は<b class="key">セッションが生きているか</b>を確認する。セッションが終わっていれば invalid_grant になる。`
      ],
      tip: `Refresh Token はセッションに紐づく。セッションが死ねば、トークンが残っていても取り直せない。` },
    { id: 'c09-mc-03', stem: `【組合せ型】Password Grant と Device Grant に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Password Grant は MFA・SSO・ソーシャルログインが使えず、OAuth 2.1 で廃止された。` },
        { label: 'B', text: `Device Grant では、デバイスの画面で ID とパスワードを直接入力する。` },
        { label: 'C', text: `Device Grant では、デバイスが interval 秒ごとに token endpoint をポーリングし、承認前は authorization_pending が返る。` },
        { label: 'D', text: `Password Grant では、アプリは Keycloak のログイン画面を経由するため、パスワードを見ない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ Password Grant は<b class="key">ログイン画面を経由しない</b>ので MFA/SSO が使えず、OAuth 2.1 で廃止された。テスト・移行用途のみである。`,
        `B：× Device Grant のログインは<b class="key">別端末</b> (スマホ等) で行う。デバイスは user_code を表示するだけである。`,
        `C：○ デバイスは <code>interval</code> 秒ごとに<b class="key">ポーリング</b>し、承認前は <code>authorization_pending</code> が返る。`,
        `D：× Password Grant ではアプリが<b class="key">パスワードそのものを見る</b>。これが非推奨の理由である。`
      ],
      tip: `Password Grant は「アプリがパスワードを預かる」、Device Grant は「パスワードは別端末に預けて待つ」。` },
    { id: 'c09-mc-04', stem: `【正誤選択型】Token Exchange に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        '交換リクエストは、ユーザーのブラウザが Keycloak の authorization endpoint に対して行う。',
        'あるトークンを、別の audience・別ユーザー・別 IdP 用のトークンに交換できる。',
        'v26.2 で、RFC 8693 に基づく Standard Token Exchange (内部↔内部) が正式対応した。',
        'マイクロサービスが受け取ったユーザーのトークンを、下流サービス向けに交換する用途がある。',
        '交換後のトークンは aud が下流サービスになり、sub は元のユーザーと同じである。'
      ], answer: 1,
      explain: [
        `1：× 交換は <code>POST /token</code> で、<b class="key">Service A が自分の client 認証付き</b>で Keycloak に送る。ブラウザや authorization endpoint は使わない。`,
        `2：○ 別の audience / 別ユーザー / 別 IdP 用のトークンに交換できる。`,
        `3：○ v26.2 で Standard Token Exchange (RFC 8693、内部↔内部) が正式対応した。`,
        `4：○ <b class="key">下流呼び出し (On-Behalf-Of)</b> が代表的な用途である。`,
        `5：○ 新しい Access Token は <code>aud=service-b</code>、<code>sub</code> は元と同じユーザーである。`
      ],
      tip: `Token Exchange はサービス同士の裏方の交換で、ブラウザを巻き込まない。ユーザーの身元 (sub) はそのまま引き継ぐ。` },
    { id: 'c09-mc-05', stem: `【組合せ型】Logout に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `RP-Initiated Logout では id_token_hint も client_id も不要で、post_logout_redirect_uri は任意の URL を指定できる。` },
        { label: 'B', text: `Back-Channel Logout は、iframe を使ってブラウザ経由で通知する方式である。` },
        { label: 'C', text: `Back-Channel Logout では、Keycloak がアプリのサーバーへ logout_token (JWT) を POST する。` },
        { label: 'D', text: `Front-Channel Logout は、iframe 経由で通知する方式である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× <code>id_token_hint</code> か <code>client_id</code> が必要 (v18+) で、<code>post_logout_redirect_uri</code> は「Valid post logout redirect URIs」に<b class="key">登録必須</b>である。`,
        `B：× iframe 経由は Back-Channel ではなく <b class="key">Front-Channel</b> である。`,
        `C：○ Back-Channel は <b class="key">Keycloak → アプリのサーバー</b>に <code>logout_token</code> を POST する。`,
        `D：○ Front-Channel は<b class="key">iframe 経由</b>である。`
      ],
      tip: `Back は裏口 (サーバー同士の POST)、Front は表口 (ブラウザの iframe)。名前の通りに通信の経路が違う。` },
    { id: 'c09-mc-06', stem: `【正誤選択型】SAML SSO に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        'SAML の Entity ID は、OIDC の redirect_uri に相当する。',
        'SAML の Assertion は、OIDC の client_id に相当する。',
        'SP-initiated の SAML SSO では、IdP が先に AuthnRequest を SP に送る。',
        'SP-initiated の SAML SSO では、SP が AuthnRequest を Keycloak (IdP) に送り、ログイン後に署名付き XML の SAMLResponse が SP に POST される。',
        'SAML の ACS URL は、OIDC の ID Token に相当する。'
      ], answer: 4,
      explain: [
        `1：× Entity ID は <b class="key">client_id</b> に相当する。redirect_uri に相当するのは ACS URL である。`,
        `2：× Assertion は <b class="key">ID Token</b> に相当する。client_id に相当するのは Entity ID である。`,
        `3：× AuthnRequest を送るのは <b class="key">SP</b> から IdP (Keycloak) である。`,
        `4：○ SP → AuthnRequest → Keycloak (IdP) → ログイン → <b class="key">SAMLResponse (署名付き XML)</b> を SP に POST する流れである。`,
        `5：× ACS URL は <b class="key">redirect_uri</b> に相当する。ID Token に相当するのは Assertion である。`
      ],
      tip: `対応は「Assertion = ID Token、Entity ID = client_id、ACS URL = redirect_uri」。3組を取り違えないこと。` },
    { id: 'c09-mc-07', stem: `【組合せ型】Identity Brokering に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Google が発行したトークンがアプリに渡り、アプリが Google のトークンを検証する。` },
        { label: 'B', text: `アプリは Keycloak としか通信せず、Keycloak がアプリ用のトークンを新規発行する。` },
        { label: 'C', text: `First Login Flow で、初回ログインのユーザーを自動作成したり、既存ユーザーとリンクしたりする。` },
        { label: 'D', text: `Identity Provider Mapper は、Keycloak のユーザー属性を Google のユーザー属性へ書き込む。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× Google のトークンは<b class="key">アプリに届かない</b>。アプリが受け取るのは Keycloak のトークンである。`,
        `B：○ アプリは Keycloak しか知らなくてよく、<b class="key">Keycloak 自身のトークン</b> (iss = Keycloak) が発行される。`,
        `C：○ <b class="key">First Login Flow</b> がユーザーの自動作成 / 既存ユーザーとのリンクを担う。`,
        `D：× 向きが逆である。Identity Provider Mapper は <b class="key">Google の属性を Keycloak のユーザー属性</b>に対応づける。`
      ],
      tip: `Keycloak が外部 IdP とアプリの間に立つ「通訳窓口」になり、アプリには自分名義のトークンだけを渡す。` },
    { id: 'c09-mc-08', stem: `【正誤選択型】利用場面とフローの組合せに関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        'ユーザーが不在のバッチ処理には、Device Authorization Grant を使う。',
        'ブラウザ入力が困難な TV・CLI・IoT には、Device Authorization Grant を使う。',
        'MFA を使いたい SPA のログインには、Password Grant を使う。',
        'ユーザーの sub を保ったまま下流サービスを呼びたいときは、Client Credentials Flow を使う。',
        'ブラウザでユーザーがログインする通常の Web アプリには、Client Credentials Flow を使う。'
      ], answer: 2,
      explain: [
        `1：× ユーザー不在のサーバー間は <b class="key">Client Credentials</b> である。Device Grant はユーザーが別端末で承認する。`,
        `2：○ <b class="key">Device Authorization Grant</b> は TV・CLI・IoT など、ブラウザ入力が困難なデバイス向けである。`,
        `3：× Password Grant は MFA / SSO が使えず非推奨である。`,
        `4：× 元のユーザーの sub を保って下流を呼ぶのは <b class="key">Token Exchange</b> である。Client Credentials の sub は service account になる。`,
        `5：× Client Credentials は<b class="key">ユーザー不在</b>のフローである。ユーザーがログインする Web アプリには Authorization Code Flow を使う。`
      ],
      tip: `誰が主語かで選ぶ。ユーザー不在 = Client Credentials、別端末で承認 = Device、ユーザーの身元を引き継ぐ = Token Exchange。` },
    { id: 'c09-mc-09', stem: `【組合せ型】各フローのリクエストの特徴に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Token Exchange のリクエストは、Service A が Keycloak の token endpoint に、自分の client 認証 (secret) を付けて送る。` },
        { label: 'B', text: `Device Grant のデバイスは、最初に POST /auth/device を呼び、device_code と user_code を受け取る。` },
        { label: 'C', text: `Client Credentials のレスポンスには、通常 refresh_token と id_token が含まれる。` },
        { label: 'D', text: `Password Grant では、MFA と SSO を使うことができる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：○ 図のとおり、<code>Authorization: Basic (service-a:secret)</code> と <code>grant_type=token-exchange</code> を付けて <code>POST /token</code> する。`,
        `B：○ <code>POST /auth/device</code> (<code>client_id=cli-tool</code>) で、<code>device_code</code> や <code>user_code</code> などを受け取る。`,
        `C：× 返るのは <b class="key">access_token のみ</b>で、refresh_token・id_token は基本的にない。`,
        `D：× Password Grant は<b class="key">ログイン画面を経由しない</b>ので MFA / SSO が使えない。`
      ],
      tip: `Token Exchange は client 認証付きの POST /token、Device は専用の /auth/device から始まる。入口のエンドポイントが違う。` }
  ]
});
