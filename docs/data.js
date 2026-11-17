window.DATA = { chapters: [] };
// 第1章 ハンズオン形式
DATA.chapters.push({
  no: 1, title: `全体像`,
  lessons: [
    { id: 'c01-l01', title: `Keycloak とは・登場人物`, pages: [
      { id: 'c01-l01-p01', title: `作業フォルダを作り、Keycloak を Docker で起動する`,
        html: `<p class="goal">やりたいこと: 第17章まで使う作業フォルダ <code>~/develop/kc-handson/</code> を作り、docker-compose.yml で Keycloak を起動する。以降の章はこのフォルダとこの Keycloak を前提にする。</p><div class="step"><h4>手順 1　前提ソフトを確認する</h4><p>Docker Desktop / curl / jq / Node.js 20 以上 / python3 のバージョンを表示する。</p><pre>docker --version &amp;&amp; docker compose version
curl --version | head -1
jq --version
node --version
python3 --version</pre><div class="check"><b>確認</b><pre class="out">5つのコマンドがすべてバージョンを表示する。</pre></div><div class="read"><b>読み方</b><p><code>command not found</code> が出たものは未インストール。Node.js は 20 以上であること。</p></div></div><div class="step"><h4>手順 2　フォルダと docker-compose.yml を作って起動する</h4><p>後の章で <code>spa/</code> <code>web/</code> <code>api/</code> を使うので先に作る。Keycloak 1台だけの開発モード構成を書いて起動する (初回はイメージ取得と初期化で数分、Keycloak の起動自体は 30〜60 秒)。</p><pre>mkdir -p ~/develop/kc-handson/spa ~/develop/kc-handson/web ~/develop/kc-handson/api
cd ~/develop/kc-handson
cat &gt; docker-compose.yml &lt;&lt; 'EOF'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.4
    command: start-dev
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_HOSTNAME: http://localhost:8080
      KC_HTTP_ENABLED: "true"
    ports:
      - "8080:8080"
    volumes:
      - kc_data:/opt/keycloak/data

volumes:
  kc_data:
EOF
docker compose up -d
docker compose logs -f keycloak</pre><div class="check"><b>確認</b><pre class="out">Keycloak 26.4.x ... started in 10.xxxs. Listening on: http://0.0.0.0:8080</pre></div><div class="read"><b>読み方</b><p>ログに次の行が出たら <code>Ctrl+C</code> でログ表示だけ止める (Keycloak は動き続ける)。</p><p><code>Listening on</code> が出れば起動済み。設定値の意味は次のとおり。</p><ul><li><code>KC_BOOTSTRAP_ADMIN_*</code> は最初の管理者 (<code>admin</code> / <code>admin</code>) を作る設定で、初回起動時にだけ効く。</li><li><code>KC_HOSTNAME: http://localhost:8080</code> はトークンの <code>iss</code> に入る URL を固定する。以降、ブラウザも curl も必ず <code>localhost</code> でアクセスする (<code>127.0.0.1</code> は使わない)。</li><li><code>kc_data</code> ボリュームに設定が残るので、再起動しても realm やユーザーは消えない。完全に初期化するときは <code>docker compose down -v</code>。</li><li><code>start-dev</code> は学習用の開発モード (HTTP 可・簡易 DB)。本番では使わない (第12章)。</li></ul></div></div><div class="step"><h4>手順 3　応答を curl で確かめる</h4><p><code>master</code> realm のエンドポイントから HTTP ステータスだけ取る。</p><pre>curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/realms/master</pre><div class="check"><b>確認</b><pre class="out">200</pre></div><div class="read"><b>読み方</b><p><code>200</code> が表示される。<code>docker compose ps</code> では keycloak が <code>running</code> になる。</p><p><code>200</code> なら Keycloak が応答していて、<code>master</code> realm は最初から存在する。<code>curl: (7) Failed to connect</code> なら、まだ起動中か、ポート 8080 を別のプロセスが使っている。ログを見るか <code>lsof -i :8080</code> を実行する。</p></div></div>`,
        oxIds: [] },
      { id: 'c01-l01-p02', title: `管理コンソールに入り、Realm demo を作る`,
        html: `<p class="goal">やりたいこと: 管理コンソールに入り、ハンズオン専用の <b>Realm</b> <code>demo</code> を作る。<code>master</code> realm は Keycloak 自体の管理用なので、業務アプリ用の設定は別の realm に作るのが原則。</p><div class="step"><h4>手順 1　demo realm を作る</h4><p><code>http://localhost:8080</code> の「Administration Console」を開き、<code>admin</code> / <code>admin</code> でログインする。左上の Realm 切り替え (現在 <code>master</code>) →「Create realm」→ Realm name = <code>demo</code> →「Create」。</p><div class="check"><b>確認</b><pre class="out">http://localhost:8080/admin/master/console/#/demo</pre></div><div class="read"><b>読み方</b><p>画面左上が <code>demo</code> になり、アドレスバーの URL が次の形になる。</p><p>URL が <code>#/demo</code> で左上も <code>demo</code> なら、いま設定しているのは demo realm。<code>master</code> のまま作業すると業務用の設定が管理用 realm に混ざる。この時点で realm は空 (ユーザーもクライアントも無い)。</p></div></div><div class="step"><h4>手順 2　demo の Discovery を取る</h4><p>ターミナルで demo realm の Discovery を取る。</p><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{issuer, authorization_endpoint, token_endpoint}'</pre><div class="check"><b>確認</b><pre class="out">{
  "issuer": "http://localhost:8080/realms/demo",
  "authorization_endpoint": "http://localhost:8080/realms/demo/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:8080/realms/demo/protocol/openid-connect/token"
}</pre></div><div class="read"><b>読み方</b><p>3項目が返る。</p><p><code>issuer</code> が <code>http://localhost:8080/realms/demo</code> なら、これが demo realm の「住所」で、以降のトークンの <code>iss</code> と一致する。<code>Realm does not exist</code> なら realm 名の打ち間違いなので、管理コンソールの realm 名と URL の <code>/realms/demo</code> を見比べる。</p></div></div>`,
        oxIds: [] },
      { id: 'c01-l01-p03', title: `User alice と bob を作り、パスワードを設定する`,
        html: `<p class="goal">やりたいこと: ログインする人 (<b>User</b>) を2人作る。<code>alice</code> はメール検証済み、<code>bob</code> は未検証。この違いを後の章 (<code>email_verified</code> claim やメール関連の機能) で使う。パスワードは一時的でないもの (Temporary Off) にする。</p><div class="step"><h4>手順 1　alice を作ってパスワードを設定する</h4><p>左メニュー「Users」→「Create new user」。Username = <code>alice</code>、Email = <code>alice@example.com</code>、First name = <code>Alice</code>、Last name = <code>Example</code>、「Email verified」= <code>On</code> で「Create」。続けて「Credentials」タブ →「Set password」で、Password と Password confirmation に <code>alice</code>、「Temporary」= <code>Off</code> として「Save」→「Save password」。</p><div class="check"><b>確認</b><pre class="out">左メニュー「Users」の一覧に alice の行が出る。</pre></div><div class="read"><b>読み方</b><p>行があれば作成成功。パスワードが通るかは手順3で確かめる。</p></div></div><div class="step"><h4>手順 2　bob を作ってパスワードを設定する</h4><p>同様に「Create new user」から Username = <code>bob</code>、Email = <code>bob@example.com</code>、First name = <code>Bob</code>、Last name = <code>Example</code>。「Email verified」は <code>Off</code> のまま「Create」。「Credentials」タブでパスワード <code>bob</code>、「Temporary」= <code>Off</code> を設定する。</p><div class="check"><b>確認</b><pre class="out">「Users」の一覧に alice と bob の2行が出る。</pre></div><div class="read"><b>読み方</b><p>2行そろっていれば、ユーザー作成は完了。</p></div></div><div class="step"><h4>手順 3　パスワードが通ることを curl で確かめる</h4><p>標準クライアント <code>admin-cli</code> を使って、2人のパスワードでトークンを取る。</p><pre>for u in alice bob; do curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=$u -d password=$u | jq -c --arg u $u '{user: $u, ok: has("access_token"), error}'; done</pre><div class="check"><b>確認</b><pre class="out">{"user":"alice","ok":true,"error":null}
{"user":"bob","ok":true,"error":null}</pre></div><div class="read"><b>読み方</b><p>2行とも <code>ok</code> が <code>true</code>。</p><p>両方 <code>ok: true</code> なら、作成とパスワード (Temporary Off) の設定が成功。これらのユーザーは <code>demo</code> にだけ存在する (l02 p01 で確かめる)。失敗パターンは次のとおり。</p><ul><li><code>invalid_grant</code> / <code>Account is not fully set up</code> は、「Temporary」が On のまま初回ログイン時にパスワード変更を要求されているか、First name / Last name / Email が空 (Keycloak 26 の既定ではこれらが必須)。Users の画面で補ってパスワードを設定し直す。</li><li><code>invalid_grant: Invalid user credentials</code> はパスワードの打ち間違い。<code>Account disabled</code> 系はユーザーの Enabled が Off。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c01-l01-p04', title: `Keycloak が話せる規格 (OIDC と SAML) を確かめる`,
        html: `<p class="goal">やりたいこと: Keycloak は OSS の IdP (認証認可サーバー) で、OIDC と SAML の両方を話せる。OAuth 2.0 は認可、OIDC はその上に「誰がログインしたか (ID トークン)」を足したもの、SAML は XML ベースの古い SSO 規格。同じ realm に両方の入口があることを確かめる。</p><div class="step"><h4>手順 1　OIDC の入口 (Discovery) を取る</h4><p>demo realm の Discovery から <code>issuer</code> と <code>grant_types_supported</code> を取る。</p><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{issuer, grant_types_supported}'</pre><div class="check"><b>確認</b><pre class="out">{
  "issuer": "http://localhost:8080/realms/demo",
  "grant_types_supported": ["authorization_code", "client_credentials", "implicit", "password", "refresh_token", "urn:ietf:params:oauth:grant-type:device_code", "urn:ietf:params:oauth:grant-type:token-exchange", "urn:ietf:params:oauth:grant-type:uma-ticket", "urn:openid:params:grant-type:ciba"]
}</pre></div><div class="read"><b>読み方</b><p>JSON が返る。<code>grant_types_supported</code> の並びと数は Keycloak のバージョンで変わる。</p><p>JSON が返れば <b>OIDC</b> の入口がある。<code>grant_types_supported</code> は第8・9章で扱う grant の一覧。<code>Realm does not exist</code> なら realm <code>demo</code> を作っていない (管理コンソールの realm 一覧に <code>demo</code> があるか見る)。</p></div></div><div class="step"><h4>手順 2　SAML の入口 (IdP descriptor) を取る</h4><p>IdP descriptor の先頭だけを見る。</p><pre>curl -s http://localhost:8080/realms/demo/protocol/saml/descriptor | head -c 300</pre><div class="check"><b>確認</b><pre class="out">&lt;md:EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" ... entityID="http://localhost:8080/realms/demo"&gt;&lt;md:IDPSSODescriptor ...</pre></div><div class="read"><b>読み方</b><p>XML が返る。先頭の約300文字だけを切り出すので、途中で切れて表示される。</p><p>JSON と XML の両方が返ったので、同じ realm が <b>OIDC</b> と <b>SAML</b> の両方の入口を持つ。以降の章は OIDC が中心で、SAML は第9章で触れる。</p></div></div>`,
        oxIds: [] },
      { id: 'c01-l01-p05', title: `OAuth の4つの登場人物を Keycloak の標準機能に当てはめる`,
        html: `<p class="goal">やりたいこと: OAuth / OIDC の4つの役割 (Resource Owner / Client / Authorization Server / Resource Server) を実物に対応づける。ここでは Keycloak が最初から持つ「アカウント画面」(Client) とその API (Resource Server) を使う。自作アプリは第6章以降。</p><div class="step"><h4>手順 1　アカウント画面にログインして token のリクエストを見る</h4><p>別のブラウザウィンドウで <code>http://localhost:8080/realms/demo/account</code> を開き、<code>alice</code> / <code>alice</code> でログインする。開発者ツールの Network タブを開いてリロードする。</p><div class="check"><b>確認</b><pre class="out">Network タブに token を含むリクエストが出る。</pre></div><div class="read"><b>読み方</b><p>アカウント画面 (Client) が Keycloak の token エンドポイントにトークンを取りに行っている。トークンを発行するのは Keycloak (Authorization Server)。</p></div></div><div class="step"><h4>手順 2　トークンの有無で API の応答を比べる</h4><p>トークンなしと、alice のトークン付きで、アカウント画面が使う API を呼ぶ。</p><pre>curl -s -o /dev/null -w '%{http_code}\\n' -H 'Accept: application/json' http://localhost:8080/realms/demo/account
AT=$(curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=alice -d password=alice | jq -r .access_token)
curl -s -H 'Accept: application/json' -H "Authorization: Bearer $AT" http://localhost:8080/realms/demo/account | jq '{username, email, emailVerified}'</pre><div class="check"><b>確認</b><pre class="out">401
{
  "username": "alice",
  "email": "alice@example.com",
  "emailVerified": true
}</pre></div><div class="read"><b>読み方</b><p>1つ目は <code>401</code>、2つ目は alice の情報が返る。</p><p>トークンなしが 401、トークン付きが alice の情報なら、API (Resource Server) は「アクセストークンを持たない人は入れない」し、トークンの持ち主 (Resource Owner) のデータだけ返す。「Client」は「ログインを任せるアプリ」で、ユーザーのブラウザのことではない。</p><table><tr><th>役割 (OAuth の呼び名)</th><th>ここでの実物</th></tr><tr><td>Resource Owner (ユーザー)</td><td><code>alice</code></td></tr><tr><td>Client (アプリ)</td><td>アカウント画面 (<code>account-console</code>)、<code>admin-cli</code>。自作アプリは第6章以降で登録する</td></tr><tr><td>Authorization Server</td><td>Keycloak (:8080)</td></tr><tr><td>Resource Server (API)</td><td>アカウント API (<code>/realms/demo/account</code>)</td></tr></table><ul><li>トークン付きでも 401/403 なら、トークンが空・期限切れ (5分)・別 realm のものなど。Authorization ヘッダーとトークンの取得結果を見直す。</li><li>応答の項目名は Keycloak のバージョンで異なりうる。項目が出なくても、トークン付きで 200 なら理解としては十分。</li></ul></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c01-l02', title: `Keycloak の中身 (Realm〜Session)`, pages: [
      { id: 'c01-l02-p01', title: `Realm: realm が違うとユーザーも別物になることを確かめる`,
        html: `<p class="goal">やりたいこと: <b>Realm</b> は、ユーザー・クライアント・設定をまとめた独立の管理単位 (テナント)。realm が違えば同じ username でも別人であることを、同じユーザー名でログインして確かめる。</p><div class="step"><h4>手順 1　管理コンソールで demo と master のユーザーを見比べる</h4><p>Realm 切り替えで <code>demo</code> を選んで左メニュー「Users」を開き、次に <code>master</code> に切り替えて「Users」を開く。</p><div class="check"><b>確認</b><pre class="out">demo には alice と bob がいて、master には alice がいない。URL は .../admin/master/console/#/demo/... の形になる。</pre></div><div class="read"><b>読み方</b><p>realm ごとにユーザー一覧が別。<code>master</code> は Keycloak 自体の管理者用 (admin はここにいる) なので、業務アプリのユーザーは入れない。</p></div></div><div class="step"><h4>手順 2　同じ資格情報を demo と master に送る</h4><p>demo realm の alice でトークンを取り (admin-cli は各 realm に最初から入っているクライアント)、同じ資格情報を master realm にも送る。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=alice -d password=alice | jq 'keys'
curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=alice -d password=alice | jq</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "not-before-policy", "refresh_expires_in", "refresh_token", "scope", "session_state", "token_type" ]
{
  "error": "invalid_grant",
  "error_description": "Invalid user credentials"
}</pre></div><div class="read"><b>読み方</b><p>demo ではキー一覧、master ではエラーが返る。</p><p>demo ではトークンが返り master では <code>invalid_grant</code> なら、alice は demo realm にだけ存在する。realm 名が URL の一部 (<code>/realms/demo/</code> と <code>/realms/master/</code>) なので、以降のすべての URL で <code>demo</code> を使う。<code>Invalid user credentials</code> が demo 側で出たら、パスワードの打ち間違いか realm の間違い。</p></div></div>`,
        oxIds: [] },
      { id: 'c01-l02-p02', title: `User と Role: alice に Role を付けて確かめる`,
        html: `<p class="goal">やりたいこと: <b>User</b> はログインする人、<b>Role</b> は権限のラベル。後の章で自作 API の <code>/admin</code> (要 role <code>admin</code>) を試すので、2つの Realm Role を作り、alice に <code>user</code> と <code>admin</code>、bob に <code>user</code> を付ける。</p><div class="step"><h4>手順 1　Realm Role を2つ作る</h4><p>realm <code>demo</code> で左メニュー「Realm roles」を開き、一覧を見てから「Create role」で Role name = <code>user</code> を「Save」。同様に <code>admin</code> も作る。</p><div class="check"><b>確認</b><pre class="out">作る前の一覧には default-roles-demo 等だけがあり、作成後は user と admin が加わる。</pre></div><div class="read"><b>読み方</b><p>新しい realm には <code>user</code> と <code>admin</code> は最初から無いので自分で作る。</p></div></div><div class="step"><h4>手順 2　alice と bob に Role を付ける</h4><p>「Users」→ <code>alice</code> →「Role mapping」タブ →「Assign role」→「Filter by realm roles」に切り替え、<code>user</code> と <code>admin</code> にチェックして「Assign」。同様に <code>bob</code> には <code>user</code> だけを付ける。</p><div class="check"><b>確認</b><pre class="out">default-roles-demo
user
admin</pre></div><div class="read"><b>読み方</b><p>alice の「Role mapping」タブに次が並ぶ (Inherited の <code>default-roles-demo</code> も出る)。</p><p>Role mapping に並べば、付けた Role は後に <code>realm_access.roles</code> という claim としてトークンに入る (第2章で frontend-spa を作り、第3章 l03 p01 で確かめる)。admin-cli のトークンは軽量アクセストークンで claim を含まないので、ここでは見ない。</p><ul><li>bob に <code>admin</code> を付けていないので、同じクライアントでもユーザーが違えば権限が違う。自作 API の <code>/admin</code> で使い分ける (第8章)。</li><li><code>default-roles-demo</code> は新規ユーザーに自動で付く複合ロール (offline_access や account 用ロールを含む)。自分で付けたものではない。</li><li>何も出ないなら Assign が押されていない。「Filter by realm roles」に切り替えないと Realm Role が一覧に出ない。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c01-l02-p03', title: `残りの部品 (Client Scope / Identity Provider / Federation / Authentication Flow) の置き場所を探す`,
        html: `<p class="goal">やりたいこと: Client Scope・Identity Provider・User Federation・Authentication Flow は後の章で詳しく扱う。いまは「どのメニューにあるか」だけ確認して迷子にならないようにする。</p><div class="step"><h4>手順 1　Clients と Client scopes を開く</h4><p>realm <code>demo</code> で左メニュー「Clients」を開いて既定のクライアント名を読む。次に「Client scopes」を開き、<code>email</code> をクリックして「Mappers」タブの Mapper 名を読む。</p><div class="check"><b>確認</b><pre class="out">次のものが見える。</pre></div><div class="read"><b>読み方</b><p><code>email</code> スコープの中に Mapper が2つあるので、「Client Scope = Mapper のセット」。トークンの <code>email</code> / <code>email_verified</code> claim はこの Mapper が作る。Clients に自分用のクライアントが無いので、これから <b>Client</b> を登録して初めてアプリが Keycloak にログインを依頼できる。</p></div></div><div class="step"><h4>手順 2　Identity providers / User federation / Authentication を開く</h4><p>左メニュー「Identity providers」「User federation」「Authentication」を順に開く。Authentication は Flows 一覧の <code>browser</code> を読む。</p><div class="check"><b>確認</b><pre class="out">次のものが見える。</pre></div><div class="read"><b>読み方</b><p>Identity providers が空なら、外部 IdP (Google 等) のログインはまだ無い。登録するとログイン画面にボタンが増える。Identity Provider は「Keycloak の外にあるログイン元」、User Federation は「既存のユーザー名簿 (LDAP) をつなぐ」で、どちらも外部連携だが役割が違う。</p></div></div>`,
        oxIds: [] },
      { id: 'c01-l02-p04', title: `Session: 「ログイン中」の状態が Keycloak に残っているのを見る`,
        html: `<p class="goal">やりたいこと: <b>Session</b> は「ログイン中」という状態で、Keycloak が覚えている。アプリ側のログイン状態とは別物であることを、管理コンソールの Sessions 画面で見る。</p><div class="step"><h4>手順 1　ログインして Sessions に行が出るのを見る</h4><p>別のブラウザウィンドウ (またはシークレットウィンドウ) で <code>http://localhost:8080/realms/demo/account</code> を開き、<code>alice</code> / <code>alice</code> でログインする。管理コンソールに戻って左メニュー「Sessions」を開く (必要なら再読み込み)。「Users」→ <code>alice</code> →「Sessions」タブにも同じものが出る。</p><div class="check"><b>確認</b><pre class="out">User: alice   Type: Regular   Started: 数分前   Last access: 数秒前   Clients: account-console</pre></div><div class="read"><b>読み方</b><p>alice の行が出る。</p><p>ログインすると Keycloak 側に SSO セッションができる。Clients 列は、そのセッションを使っているアプリ。別アプリを開いたとき再入力がいらないのは、この Session が残っているから (SSO)。第7章・第9章でもう一度確認する。何も出ないときは、表示中の realm が <code>demo</code> か (master のコンソールを見ていないか) を確認する。</p></div></div><div class="step"><h4>手順 2　サインアウトして行が消えるのを見る</h4><p>シークレットウィンドウの account 画面で「Sign out」し、管理コンソールの Sessions を再読み込みする。</p><div class="check"><b>確認</b><pre class="out">alice の行が消える。</pre></div><div class="read"><b>読み方</b><p>Keycloak 側のセッションが終了した。逆に、アプリのセッションだけ消して Keycloak のセッションを残すとログイン状態が続く。これが第9章の Logout の話。</p></div></div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
// 第2章 ハンズオン形式
DATA.chapters.push({
  no: 2, title: `主要エンドポイント(OIDC)`,
  lessons: [
    { id: 'c02-l01', title: `Discovery と認可・トークン・userinfo・jwks・introspection`, pages: [
      { id: 'c02-l01-p01', title: `Discovery: すべてのエンドポイントの URL を1か所で確かめる`,
        html: `<p class="goal">やりたいこと: OIDC のエンドポイントは URL を暗記せず、<b>Discovery</b> 文書 (<code>.well-known/openid-configuration</code>) から引く。realm demo の Discovery から全体を見る。</p><div class="step"><h4>手順 1　Discovery を取って URL の項目を一覧にする</h4><p>整形表示して先頭を眺め、URL の項目だけを抜き出す。</p><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq . | head -40
curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq 'to_entries[] | select(.key | test("endpoint|jwks_uri|issuer|check_session_iframe")) | "\\(.key) = \\(.value)"' -r</pre><div class="check"><b>確認</b><pre class="out">issuer = http://localhost:8080/realms/demo
authorization_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/auth
token_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/token
introspection_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/token/introspect
userinfo_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/userinfo
end_session_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/logout
jwks_uri = http://localhost:8080/realms/demo/protocol/openid-connect/certs
revocation_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/revoke
device_authorization_endpoint = http://localhost:8080/realms/demo/protocol/openid-connect/auth/device
...</pre></div><div class="read"><b>読み方</b><p>endpoint 系の URL が並ぶ。実際はこの間に check_session_iframe、registration_endpoint、各種 *_auth_methods_supported など、ほかの行も挟まって出る (下は endpoint 系を抜粋した)。</p><p>項目が返れば Discovery は認証なしで誰でも取れる。ライブラリは <code>issuer</code> だけ渡せば残りをここから自動で引く (Spring の <code>issuer-uri</code> など)。</p><ul><li>すべての URL が <code>/realms/demo/protocol/openid-connect/</code> 配下なのは、Keycloak 17 以降 (Quarkus 版) に <code>/auth</code> プレフィックスが無いため。古い資料の <code>/auth/realms/...</code> は動かない。</li><li>空の結果や 404 は realm 名 (<code>demo</code>) の打ち間違い。</li></ul></div></div><div class="step"><h4>手順 2　使えるスコープと grant を見る</h4><p>スコープと grant の種類を取る。</p><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{scopes_supported, grant_types_supported}'</pre><div class="check"><b>確認</b><pre class="out">scopes_supported と grant_types_supported の配列が返る。</pre></div><div class="read"><b>読み方</b><p><code>grant_types_supported</code> は、第8・9章で扱う grant のうち、この realm で有効化されているものの一覧。</p></div></div>`,
        oxIds: [] },
      { id: 'c02-l01-p02', title: `道具を用意する: Client を2つ作り、補助関数ファイルを置く`,
        html: `<p class="goal">やりたいこと: 以降の章ではトークンの取得と decode を何度も行う。そのために curl 用のクライアント <code>frontend-spa</code> (Public)、introspection 用のクライアント <code>api-service</code> (Confidential)、シェル補助関数 <code>~/develop/kc-handson/kc-lab.sh</code> を用意する。この章で作ったものを以降の章が前提として使う。</p><div class="step"><h4>手順 1　frontend-spa を作る</h4><p>管理コンソール (realm <code>demo</code>) で「Clients」→「Create client」。Client type = <code>OpenID Connect</code>、Client ID = <code>frontend-spa</code> で「Next」。Capability config は Client authentication = <code>Off</code>、Authorization = <code>Off</code>、Authentication flow は「Standard flow」と「Direct access grants」にチェックして「Next」 (Direct access grants は curl でトークンを取るための学習用。第9章で外す)。Login settings は Valid redirect URIs = <code>http://localhost:3000/*</code>、Valid post logout redirect URIs = <code>http://localhost:3000/*</code>、Web origins = <code>http://localhost:3000</code> を入れて「Save」。</p><div class="check"><b>確認</b><pre class="out">「Clients」の一覧に frontend-spa が出る。</pre></div><div class="read"><b>読み方</b><p>一覧にあれば登録済み。トークン取得の成否は手順3で確かめる。</p></div></div><div class="step"><h4>手順 2　api-service を作って secret を控える</h4><p>「Clients」→「Create client」で Client ID = <code>api-service</code> →「Next」。Capability config は Client authentication = <code>On</code>、Authentication flow のチェックを全部外して「Next」→「Save」。<code>api-service</code> の「Credentials」タブで Client secret を控える。</p><div class="check"><b>確認</b><pre class="out">「Credentials」タブに Client secret が表示される。</pre></div><div class="read"><b>読み方</b><p>Client authentication が On のクライアントだけ secret を持つ (Confidential)。この secret を次の手順で使う。</p></div></div><div class="step"><h4>手順 3　補助関数ファイルを作り、alice のトークンを取る</h4><p>補助関数ファイルを作る (secret は自分の値に置き換える)。読み込んで alice のトークンを取り、claim を読む。</p><pre>cat &gt; ~/develop/kc-handson/kc-lab.sh &lt;&lt; 'EOF'
export KC=http://localhost:8080/realms/demo
export OIDC=$KC/protocol/openid-connect
export CLIENT=frontend-spa
export API_SECRET=ここにapi-serviceのsecret
get_token() { curl -s -X POST $OIDC/token -d grant_type=password -d client_id=$CLIENT -d username=$1 -d password=$1 --data-urlencode "scope=openid $2"; }
_b64j() { tr '_-' '/+' | awk '{while(length($0)%4)$0=$0"=";print}' | base64 -d 2&gt;/dev/null | jq .; }
jwth() { echo "$1" | cut -d. -f1 | _b64j; }
jwt() { echo "$1" | cut -d. -f2 | _b64j; }
EOF
source ~/develop/kc-handson/kc-lab.sh
AT=$(get_token alice | jq -r .access_token)
echo \${AT:0:40}
jwt $AT | jq '{iss, azp, preferred_username}'</pre><div class="check"><b>確認</b><pre class="out">eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwi
{
  "iss": "http://localhost:8080/realms/demo",
  "azp": "frontend-spa",
  "preferred_username": "alice"
}</pre></div><div class="read"><b>読み方</b><p><code>eyJ</code> で始まる文字列と、claim が出る。</p><p>claim が読めればクライアント登録も補助関数も成功。以降 <code>get_token alice</code> / <code>jwt $AT</code> を使う。ターミナルを開き直したら <code>source ~/develop/kc-handson/kc-lab.sh</code> を最初に実行する。失敗パターンは次のとおり。</p><ul><li><code>{"error":"unauthorized_client"...}</code> は Direct access grants が On でない。<code>frontend-spa</code> の Settings で確認する。<code>{"error":"invalid_client"...}</code> は client_id の打ち間違い。</li><li><code>jwt</code> が何も出さないのは、jq が入っていないか <code>$AT</code> が空。<code>get_token alice</code> 単体でエラー JSON を確認する。</li></ul><p>Direct access grants (Password Grant) は本来非推奨。ここでは claim を観察しやすくする近道として使い、本物のログインは自作の SPA / Web アプリで行う (第6・7章)。</p></div></div>`,
        oxIds: [] },
      { id: 'c02-l01-p03', title: `authorization と token: ブラウザが開く入口と、curl で叩く窓口の違い`,
        html: `<p class="goal">やりたいこと: <b>authorization_endpoint</b> はユーザーのブラウザが開くログイン画面の入口、<b>token_endpoint</b> はアプリが直接 POST してトークンを受け取る窓口。呼び出し方がまったく違うことを体験する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Clients 一覧に <code>frontend-spa</code> があり、Valid redirect URIs が <code>http://localhost:3000/*</code>)。</p><div class="step"><h4>手順 1　authorization endpoint をブラウザで開く</h4><p>Mac は <code>open</code>、他は URL をブラウザに貼る。ログイン画面が出たら <code>alice</code> / <code>alice</code> でログインする。移動先 (<code>http://localhost:3000/manual?...</code>) はまだ何も動いていないので「接続できません」の画面になってよい。</p><pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;state=s1&amp;prompt=login"</pre><div class="check"><b>確認</b><pre class="out">http://localhost:3000/manual?state=s1&amp;session_state=...&amp;iss=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fdemo&amp;code=0c3f...</pre></div><div class="read"><b>読み方</b><p>ブラウザのアドレスバーを読む。</p><p><code>code=...&amp;state=s1</code> が付いて戻れば、authorization endpoint の仕事は「ユーザーを認証して code を redirect_uri に付けて返す」こと。<code>state</code> は送った値がそのまま戻る。</p><ul><li><code>Invalid parameter: redirect_uri</code> のエラー画面は、<code>frontend-spa</code> の Valid redirect URIs が <code>http://localhost:3000/*</code> になっていない。</li><li><code>invalid_request</code> の画面は、<code>response_type</code> や <code>client_id</code> の打ち間違い。</li></ul></div></div><div class="step"><h4>手順 2　同じ authorization endpoint を curl で叩く</h4><p>ブラウザを使わず curl で呼ぶ。</p><pre>curl -s -o /dev/null -w '%{http_code} %{content_type}\\n' "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid"</pre><div class="check"><b>確認</b><pre class="out">200 text/html;charset=utf-8</pre></div><div class="read"><b>読み方</b><p>HTML が返る。</p><p>返るのは HTML (ログイン画面) だけ。認可エンドポイントは人が操作する前提で、curl では token を取れない。</p></div></div><div class="step"><h4>手順 3　token endpoint を curl で叩く</h4><p>Password Grant で代用し、トークン本体を除いて表示する。</p><pre>get_token alice | jq 'del(.access_token, .refresh_token, .id_token)'</pre><div class="check"><b>確認</b><pre class="out">{
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "token_type": "Bearer",
  "not-before-policy": 0,
  "session_state": "...",
  "scope": "openid email profile"
}</pre></div><div class="read"><b>読み方</b><p>JSON が返る。</p><p>token endpoint は JSON で <code>access_token</code> 等を返すトークン発行の窓口。<code>token_type: Bearer</code>、<code>expires_in: 300</code> (5分) が読める。</p></div></div>`,
        oxIds: [] },
      { id: 'c02-l01-p04', title: `userinfo・jwks・introspection を順に叩く`,
        html: `<p class="goal">やりたいこと: トークンを受け取った後に使う3つの窓口の違いを見る。userinfo は「持ち主のプロフィール」、jwks は「署名検証用の公開鍵」、introspection は「トークンが今も有効か」を返す。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> と <code>api-service</code> (secret は <code>$API_SECRET</code>) が作成済み (Clients 一覧に両方がある)。</p><div class="step"><h4>手順 1　userinfo を呼ぶ</h4><p>alice のアクセストークンを取り、Bearer 付きと Bearer なしで userinfo を呼ぶ。</p><pre>AT=$(get_token alice | jq -r .access_token)
curl -s -H "Authorization: Bearer $AT" $OIDC/userinfo | jq
curl -s -o /dev/null -w '%{http_code}\\n' $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">{ "sub": "…uuid…", "email_verified": true, "name": "…", "preferred_username": "alice", "email": "alice@example.com" }
401</pre></div><div class="read"><b>読み方</b><p>Bearer 付きは claim、Bearer なしは 401。</p><p>claim が返れば、アクセストークンの持ち主のプロフィールを取れた。Bearer が無いと 401 なので、このエンドポイントはトークン必須。</p></div></div><div class="step"><h4>手順 2　jwks_uri から公開鍵を見る</h4><p>認証なしで鍵の概要を取る。</p><pre>curl -s $OIDC/certs | jq '.keys[] | {kid, kty, alg, use}'</pre><div class="check"><b>確認</b><pre class="out">{ "kid": "…", "kty": "RSA", "alg": "RS256", "use": "sig" }
{ "kid": "…", "kty": "RSA", "alg": "RSA-OAEP", "use": "enc" }</pre></div><div class="read"><b>読み方</b><p>鍵が2つ返る。</p><p>認証なしで返るので、公開鍵は誰でも取れる。<code>use: sig</code> の鍵がトークン署名の検証用で、<code>enc</code> は暗号化用なので検証には使わない。</p></div></div><div class="step"><h4>手順 3　introspection を呼ぶ</h4><p><code>api-service</code> の資格情報あり・なしで呼ぶ。</p><pre>curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq '{active, sub, scope, username, client_id}'
curl -s -d token=$AT $OIDC/token/introspect | jq</pre><div class="check"><b>確認</b><pre class="out">{ "active": true, "sub": "…", "scope": "openid email profile", "username": "alice", "client_id": "frontend-spa" }
{ "error": "invalid_request", "error_description": "Authentication failed." }</pre></div><div class="read"><b>読み方</b><p>認証ありは <code>active: true</code>、認証なしはエラー。</p><p><code>active: true</code> は Keycloak がそのトークンを今も有効と判断している。<code>active: false</code> だけが返るなら期限切れ・失効・ログアウト済み。呼び出し側のクライアント認証が必要で、認証なしだと拒否されるのは、誰でも他人のトークンを調べられないようにするため。</p><ul><li>有効なはずなのに <code>active: false</code> なら、トークンが期限切れ・失効している可能性が高い。</li><li><code>$API_SECRET</code> が違う場合は <code>active: false</code> ではなく、認証なしと同じ <code>Authentication failed.</code> のエラーになる。</li></ul></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c02-l02', title: `logout・device・revoke・issuer・呼び出し元整理・注意`, pages: [
      { id: 'c02-l02-p01', title: `end_session_endpoint (logout): SSO セッションを終わらせる`,
        html: `<p class="goal">やりたいこと: アプリ側のログアウトだけでは Keycloak にログイン状態が残る。<b>end_session_endpoint</b> を呼んで Keycloak 側のセッションを終わらせ、Sessions 画面から消え、再びログイン画面が出るところまで確認する。前提: Keycloak が <code>http://localhost:8080</code> で動いていて、realm <code>demo</code> にユーザー <code>alice</code> (パスワード <code>alice</code>) と Public クライアント <code>frontend-spa</code> (Standard flow 有効、Valid redirect URIs と Valid post logout redirect URIs が <code>http://localhost:3000/*</code>) がある。まず手順 1 でシェルの準備をする。</p><div class="step"><h4>手順 1　シェルを準備する</h4><p>ターミナルで補助ファイルを読み込み、<code>$OIDC</code> を確かめる (<code>$OIDC</code> と、ID トークンの中身を読む <code>jwt</code> 関数がこのファイルで定義される)。</p><pre>source ~/develop/kc-handson/kc-lab.sh
echo $OIDC</pre><div class="check"><b>確認</b><pre class="out">http://localhost:8080/realms/demo/protocol/openid-connect</pre></div><div class="read"><b>読み方</b><p>この URL が出れば <code>$OIDC</code> が使える。ターミナルを開き直したら再度 <code>source</code> する。</p></div></div><div class="step"><h4>手順 2　これまでのセッションを全部消す</h4><p>管理コンソール (realm <code>demo</code>) の「Sessions」を開き、右上の「Action」→「Sign out all active sessions」を選び、確認ダイアログ「Logout all sessions」で「Confirm」を押す。「Refresh」で一覧を読み込み直す。</p><div class="check"><b>確認</b><pre class="out">Sessions の一覧が空になる (行が1つも無い)。</pre></div><div class="read"><b>読み方</b><p>ここまでに <code>get_token</code> (Password Grant) を何度も実行していて、そのたびに alice のセッションが Keycloak に1つずつできている。これらは約30分残り、ブラウザのログアウトでは消えない。ログアウトで行が消えることを確かめるため、先に全部消しておく。</p></div></div><div class="step"><h4>手順 3　ブラウザでログインし、そのセッションの ID トークンを取る</h4><p>まず authorization endpoint をブラウザで開く。<code>open</code> は Mac のコマンドで、他の OS では引用符の中の URL をブラウザのアドレスバーに貼る。<code>$OIDC</code> は <code>http://localhost:8080/realms/demo/protocol/openid-connect</code> なので、開く URL の全体は次のとおり。</p><pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;state=s1"
# 開く URL: http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;state=s1</pre><p>ログイン画面で Username に <code>alice</code>、Password に <code>alice</code> を入れて「Sign In」を押す。移動先 (<code>http://localhost:3000/manual?...</code>) は何も動いていなければ「接続できません」の画面でよい。アドレスバーの <code>code=</code> の値 (<code>&amp;</code> の手前まで) をコピーし、<b>1分以内に</b> 次のコマンドの <code>ここにアドレスバーのcodeの値</code> を置き換えて実行する。<code>grant_type=authorization_code</code> で token endpoint に POST して ID トークンに交換し、<code>jwt</code> で中身を読む。</p><pre>CODE=ここにアドレスバーのcodeの値
ID=$(curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual | jq -r .id_token)
jwt $ID | jq '{preferred_username, sid}'</pre><div class="check"><b>確認</b><pre class="out">{
  "preferred_username": "alice",
  "sid": "…"
}</pre></div><div class="read"><b>読み方</b><p><code>$ID</code> はブラウザのログインでできたセッションの ID トークンで、<code>sid</code> がそのセッションの ID。次の手順で Sessions の行と突き合わせる。</p><ul><li><code>invalid_grant</code> (<code>Code not valid</code>) は <code>code</code> の期限切れ (約1分) か、コピー間違い。もう一度ブラウザでログインし直す。</li></ul></div></div><div class="step"><h4>手順 4　Sessions に alice の行があることを確認する</h4><p>管理コンソール (<code>http://localhost:8080</code>、realm <code>demo</code>) の左メニュー「Sessions」を開き、「Refresh」を押す。</p><div class="check"><b>確認</b><pre class="out">alice の行が1件だけある (Type・Started・Last access が出る行。Clients は frontend-spa)。</pre></div><div class="read"><b>読み方</b><p>この行が、手順 3 の ID トークンの <code>sid</code> と同じブラウザのセッションで、次の logout で消える対象。手順 2 で空にしたので、この1行だけが見えるはず。</p></div></div><div class="step"><h4>手順 5　logout エンドポイントを開く</h4><p>手順 3 で取った ID トークンを <code>id_token_hint</code> に付けて、ブラウザで logout エンドポイントを開く。</p><p><code>$ID</code> は手順 3 で入れたシェル変数なので、同じターミナルで実行する。</p><pre>open "$OIDC/logout?id_token_hint=$ID&amp;post_logout_redirect_uri=http://localhost:3000/&amp;state=bye"
# 開く URL: http://localhost:8080/realms/demo/protocol/openid-connect/logout?id_token_hint=(手順 3 の ID トークン)&amp;post_logout_redirect_uri=http://localhost:3000/&amp;state=bye</pre><div class="check"><b>確認</b><pre class="out">確認画面は出ず、アドレスバーが http://localhost:3000/?state=bye になる (localhost:3000 に何も動いていなければ「接続できません」の画面でよい)。</pre></div><div class="read"><b>読み方</b><p><code>post_logout_redirect_uri</code> に戻り <code>state=bye</code> が付けば、RP-Initiated Logout が成功。ブラウザ自身のログインで得た ID トークンを付けたので、Keycloak は確認なしでそのセッションを終わらせる。</p><ul><li>「Do you want to log out?」と「Logout」ボタンが出たときは、<code>id_token_hint</code> のトークンがブラウザのセッションと別 (<code>get_token</code> で取った ID トークンなど) か、<code>id_token_hint</code> の代わりに <code>client_id</code> を付けている。「Logout」を押すとブラウザのログインは外れ戻り先にも進むが、別セッションのトークンを付けた場合は、Sessions にはブラウザ側のセッションの行が残る。ここでは手順 3 の ID トークンを使う。</li><li><code>id_token_hint</code> も <code>client_id</code> も付けないと <code>Missing parameters: id_token_hint</code> のエラー画面になる。</li><li><code>Invalid redirect uri</code> は、<code>post_logout_redirect_uri</code> が Valid post logout redirect URIs に無い。詳細は第9章。</li></ul></div></div><div class="step"><h4>手順 6　セッションが終わったことを確かめる</h4><p>管理コンソールの「Sessions」を「Refresh」し、<code>http://localhost:8080/realms/demo/account</code> を開く。</p><div class="check"><b>確認</b><pre class="out">手順 4 で確認した alice の行が、Refresh しても消えている (Sessions が空になる)。
account を開くとログイン画面が出る。</pre></div><div class="read"><b>読み方</b><p>再びログイン画面が出るなら SSO セッションが終了している。アプリ側のセッションを消しただけだとこうはならない。</p><ul><li>ログイン画面が出ずに account がそのまま開くなら、SSO セッションが残っている。手順 4 で確認した alice の行が残っていないかを見る。残っていれば、手順 5 で付けた ID トークンがブラウザのセッションのものか確かめる。</li><li>ログアウト後にも古いタブやアドレスバーの履歴から開くと、画面がキャッシュで残って見えることがある。新しくアドレスを入力して開き直す。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c02-l02-p02', title: `device と revoke を叩く`,
        html: `<p class="goal">やりたいこと: <b>device_authorization_endpoint</b> は TV や CLI など入力しにくい機器向けの開始窓口、<b>revocation_endpoint</b> は指定したトークンを無効化する窓口。「呼べること」と「許可設定が必要なこと」を確かめる (device の全体は第9章)。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p><div class="step"><h4>手順 1　device エンドポイントを許可前に呼ぶ</h4><p>設定を変える前に呼ぶ。</p><pre>curl -s -X POST $OIDC/auth/device -d client_id=frontend-spa | jq</pre><div class="check"><b>確認</b><pre class="out">{ "error": "unauthorized_client", "error_description": "Client is not allowed to initiate OAuth 2.0 Device Authorization Grant. The flow is disabled for the client." }</pre></div><div class="read"><b>読み方</b><p>エラーが返る。</p><p><code>unauthorized_client</code> は、エンドポイントがあってもクライアントごとに許可 (Capability config) が必要ということ。URL が見えること = 使えること、ではない。</p></div></div><div class="step"><h4>手順 2　許可してもう一度呼ぶ</h4><p>管理コンソールで <code>frontend-spa</code> →「Settings」→ Capability config の「OAuth 2.0 Device Authorization Grant」にチェックして「Save」。同じコマンドをもう一度呼ぶ。</p><div class="check"><b>確認</b><pre class="out">{ "device_code": "…", "user_code": "ABCD-EFGH", "verification_uri": "http://localhost:8080/realms/demo/device", "verification_uri_complete": "http://localhost:8080/realms/demo/device?user_code=ABCD-EFGH", "expires_in": 600, "interval": 5 }</pre></div><div class="read"><b>読み方</b><p><code>user_code</code> を含む JSON が返る。</p><p><code>user_code</code> が返れば、機器がこれを画面に表示し、ユーザーが別端末で <code>verification_uri</code> を開いて入力する。</p></div></div><div class="step"><h4>手順 3　refresh token を revoke して再利用を試す</h4><p>トークン一式を取り、refresh token を失効させる (Public client なので client_id のみ)。失効後のトークンで refresh を試す。</p><pre>T=$(get_token alice)
RT=$(echo $T | jq -r .refresh_token)
curl -s -o /dev/null -w '%{http_code}\\n' -X POST $OIDC/revoke -d client_id=frontend-spa -d token=$RT -d token_type_hint=refresh_token
curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT | jq</pre><div class="check"><b>確認</b><pre class="out">200
{ "error": "invalid_grant", "error_description": "Session not active" }</pre></div><div class="read"><b>読み方</b><p>revoke は 200、直後の refresh はエラー。</p><p>revoke が 200 で直後の refresh が <code>invalid_grant</code> なら、失効したトークンは二度と使えない (ログアウトやトークン漏洩時に使う)。revoke 自体は存在しないトークンでも 200 を返す仕様なので、「200 = 今回失効した」とは限らない。確認は refresh を試して行う。</p></div></div>`,
        oxIds: [] },
      { id: 'c02-l02-p03', title: `issuer と、誰がどのエンドポイントを呼ぶか`,
        html: `<p class="goal">やりたいこと: トークンの <code>iss</code> は、API が信頼する issuer と完全一致する必要がある。ホスト名を固定していない Keycloak では、アクセスするホスト名 (localhost と 127.0.0.1) が違うと <code>iss</code> が変わるという罠がある。この lab (固定済み) でどう見えるかを試し、「エンドポイントを呼ぶのは誰か」も整理する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p><div class="step"><h4>手順 1　localhost と 127.0.0.1 で取ったトークンの iss を比べる</h4><p>それぞれの経由でトークンを取り、<code>iss</code> を読む。</p><pre>jwt $(get_token alice | jq -r .access_token) | jq -r .iss
T=$(curl -s -X POST http://127.0.0.1:8080/realms/demo/protocol/openid-connect/token -d grant_type=password -d client_id=frontend-spa -d username=alice -d password=alice | jq -r .access_token)
jwt $T | jq -r .iss</pre><div class="check"><b>確認</b><pre class="out">http://localhost:8080/realms/demo
http://localhost:8080/realms/demo</pre></div><div class="read"><b>読み方</b><p>どちらも同じ <code>iss</code> が出る。</p><p>127.0.0.1 経由でも <code>iss</code> が <code>localhost</code> のままなのは、第1章の docker-compose.yml で <code>KC_HOSTNAME: http://localhost:8080</code> を固定しているため。この lab ではこの罠は起きない (それでもブラウザ・curl は <code>localhost</code> で統一する)。</p><ul><li><code>KC_HOSTNAME</code> を設定していない Keycloak では、アクセスしたホスト名がそのまま発行元 URL になる (別の Keycloak で、<code>localhost</code> と <code>127.0.0.1</code> で Discovery の issuer が変わることを確認した)。127.0.0.1 で取ったトークンは <code>iss</code> が <code>127.0.0.1</code> になり、API は設定した issuer と完全一致しないトークンを拒否する。</li><li>本番でも、コンテナ内 (<code>keycloak:8080</code>) とブラウザ (<code>localhost:8080</code>) で見える URL が違うと同じ症状 (issuer 不一致の 401) になる。ホスト名 (Frontend URL / KC_HOSTNAME) を固定して揃えるのが対策。</li></ul></div></div><div class="step"><h4>手順 2　API の issuer 検証をシェルで再現する</h4><p>本物の API は第8章で作る。ここでは issuer の完全一致をシェルで再現する。</p><pre>EXPECT=http://localhost:8080/realms/demo
for t in $(get_token alice | jq -r .access_token) $T; do [ "$(jwt $t | jq -r .iss)" = "$EXPECT" ] &amp;&amp; echo OK || echo "NG (iss mismatch)"; done</pre><div class="check"><b>確認</b><pre class="out">OK
OK</pre></div><div class="read"><b>読み方</b><p>2つとも <code>OK</code>。</p><p>どちらも <code>localhost</code> になったので、ホスト名が固定されている (想定どおり)。いずれにせよ API は issuer 完全一致で検証する点は同じ。</p><p>参考として、各エンドポイントを誰が呼ぶかを整理する。</p><table><tr><th>エンドポイント</th><th>誰が呼ぶか</th><th>認証</th></tr><tr><td>authorization / end_session</td><td>ユーザーのブラウザ</td><td>ユーザーがログイン</td></tr><tr><td>token / revoke / device_authorization</td><td>アプリ (直接 POST)</td><td>Confidential は client 認証あり。Public は client_id のみ</td></tr><tr><td>introspection</td><td>API (Resource Server)</td><td>クライアント認証が必要</td></tr><tr><td>userinfo</td><td>アプリ</td><td>Bearer アクセストークン</td></tr><tr><td>discovery / jwks_uri</td><td>誰でも</td><td>不要</td></tr></table></div></div>`,
        oxIds: [] },
      { id: 'c02-l02-p04', title: `注意点: 古い URL、Discovery に載るその他の機能`,
        html: `<p class="goal">やりたいこと: 資料やネットの記事には旧 WildFly 版の URL (<code>/auth/realms/...</code>) や、普段使わない機能の URL が混じる。「動かない URL」と「あるが今は使わない URL」を見分ける。</p><div class="step"><h4>手順 1　旧形式と現行の URL を比べる</h4><p><code>/auth</code> 付きの旧形式と、現行の URL を叩く。</p><pre>curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/auth/realms/demo/.well-known/openid-configuration
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/realms/demo/.well-known/openid-configuration</pre><div class="check"><b>確認</b><pre class="out">404
200</pre></div><div class="read"><b>読み方</b><p>旧形式が 404、現行が 200。</p><p>17 以降は <code>/auth</code> が無い。古い記事のコマンドが通らないときはまずここを疑う。</p></div></div><div class="step"><h4>手順 2　Discovery にあるが今は使わない機能を探す</h4><p>該当しそうなキーだけ抜き出す。</p><pre>curl -s $KC/.well-known/openid-configuration | jq 'with_entries(select(.key | test("registration|backchannel_authentication|pushed|mtls|check_session")))'</pre><div class="check"><b>確認</b><pre class="out">{ "registration_endpoint": "…/clients-registrations/openid-connect", "check_session_iframe": "…/login-status-iframe.html", "backchannel_authentication_endpoint": "…/ext/ciba/auth", "pushed_authorization_request_endpoint": "…/ext/par/request", "mtls_endpoint_aliases": { … } }</pre></div><div class="read"><b>読み方</b><p>次のような項目が出る。</p><p><code>registration_endpoint</code> = クライアント自動登録、<code>backchannel_authentication_endpoint</code> = CIBA、<code>pushed_authorization_request_endpoint</code> = PAR、<code>mtls_endpoint_aliases</code> = mTLS 用 URL。載っていても、対応するクライアント設定を有効にしない限り使わない。一部のキーが出力に無いのは Keycloak のバージョンや設定の違いで、Discovery に無いものは実装も無いと考えてよい。</p></div></div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
// 第3章 ハンズオン形式
DATA.chapters.push({
  no: 3, title: `トークンと Claim`,
  lessons: [
    { id: 'c03-l01', title: `Claim とは・トークン種類・JWT構造`, pages: [
      { id: 'c03-l01-p01', title: `3種類のトークンを取り、見た目と claim を並べて比べる`,
        html: `<p class="goal">やりたいこと: <b>claim</b> はトークン (JWT) の中の「名前と値のペア」1つ。1回のログインで返る Access / ID / Refresh Token の3種類を取り、宛先と役割の違いを claim で見分ける。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> が作成済み (Clients に <code>frontend-spa</code> があり、Direct access grants On)。</p><div class="step"><h4>手順 1　3つのトークンの typ / aud / azp を並べる</h4><p>トークン一式を取って3つに分け、<code>typ</code> / <code>aud</code> / <code>azp</code> / <code>iss</code> を並べて見る。</p><pre>T=$(get_token alice)
AT=$(echo $T | jq -r .access_token)
IDT=$(echo $T | jq -r .id_token)
RT=$(echo $T | jq -r .refresh_token)
for t in $AT $IDT $RT; do jwt $t | jq -c '{typ, aud, azp, iss}'; done</pre><div class="check"><b>確認</b><pre class="out">{"typ":"Bearer","aud":"account","azp":"frontend-spa","iss":"http://localhost:8080/realms/demo"}
{"typ":"ID","aud":"frontend-spa","azp":"frontend-spa","iss":"http://localhost:8080/realms/demo"}
{"typ":"Refresh","aud":"http://localhost:8080/realms/demo","azp":"frontend-spa","iss":"http://localhost:8080/realms/demo"}</pre></div><div class="read"><b>読み方</b><p>3行が出る (Access / ID / Refresh の順)。</p><p>3つで宛先 (<code>aud</code>) が違う。</p><ul><li>Access Token は <code>typ</code> が <code>Bearer</code>、<code>aud</code> が API 側 (ここでは <code>account</code>)。API を呼ぶための通行証で、宛先は API。<code>aud</code> が配列になることもある。</li><li>ID Token は <code>typ</code> が <code>ID</code>、<code>aud</code> が自分のクライアント <code>frontend-spa</code>。「誰がログインしたか」を Client に伝える書類で、API に送ってはいけない。</li><li>Refresh Token は <code>aud</code> が Keycloak の issuer URL で、宛先は Keycloak だけ。API には送らない。</li><li><code>aud</code> が <code>account</code> のみで自分の API 名が無い点が、第4章で Audience を足す動機。</li><li><code>id_token</code> が無いなら scope に <code>openid</code> が入っていない (<code>get_token</code> は自動で付ける)。</li></ul></div></div><div class="step"><h4>手順 2　寿命を見る</h4><p>トークンレスポンスの <code>expires_in</code> / <code>refresh_expires_in</code> を見る。</p><pre>echo $T | jq '{expires_in, refresh_expires_in, token_type}'</pre><div class="check"><b>確認</b><pre class="out">{ "expires_in": 300, "refresh_expires_in": 1800, "token_type": "Bearer" }</pre></div><div class="read"><b>読み方</b><p>次の1行が出る。</p><p>Access Token は 300 秒 (5分)、Refresh Token は 1800 秒 (30分) で切れる。</p></div></div>`,
        oxIds: [] },
      { id: 'c03-l01-p02', title: `JWT を3つに分解して読む (header / payload / signature)`,
        html: `<p class="goal">やりたいこと: JWT は <code>header.payload.signature</code> を Base64URL でつないだ文字列。「暗号化ではなく、署名付きの書類」であることを、自分の手で分解して確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Direct access grants On)。</p><div class="step"><h4>手順 1　3つの部分に分けて長さを見る</h4><p>ドットで分けて、各部分の長さと先頭を表示する。</p><pre>AT=$(get_token alice | jq -r .access_token)
echo $AT | tr '.' '\\n' | awk '{print NR": "length($0)" chars: "substr($0,1,30)"..."}'</pre><div class="check"><b>確認</b><pre class="out">1: 111 chars: eyJhbGciOiJSUzI1NiIsInR5cCIgOiAi...
2: 9xx chars (環境で変わる): eyJleHAiOjE3...
3: 342 chars: …</pre></div><div class="read"><b>読み方</b><p>3行が出る。</p><p>3つの部分に分かれる。<code>jwt</code> 関数が空になるなら <code>$AT</code> が空なので、<code>get_token alice</code> の出力を確認する。</p></div></div><div class="step"><h4>手順 2　header と payload を decode する</h4><p>header と payload の一部を decode する。</p><pre>jwth $AT
jwt $AT | jq '{iss, sub, preferred_username, email}'</pre><div class="check"><b>確認</b><pre class="out">{ "alg": "RS256", "typ": "JWT", "kid": "…" }
{ "iss": "http://localhost:8080/realms/demo", "sub": "…", "preferred_username": "alice", "email": "alice@example.com" }</pre></div><div class="read"><b>読み方</b><p>次の2つが読める。</p><p>header が <code>alg: RS256</code> と <code>kid</code> を持つなら、RSA で署名され、どの鍵か (kid) が書いてある (第8章で JWKS と照合する)。3つ目の signature はバイナリで読めない。payload は誰でも decode できるので、<b>秘密情報を claim に入れてはいけない</b>。</p></div></div><div class="step"><h4>手順 3　payload を書き換えて使えるか試す</h4><p>payload の <code>alice</code> を <code>mallory</code> に書き換え、署名はそのままで userinfo を呼ぶ。正規のトークンとも比べる。</p><pre>P=$(echo $AT | cut -d. -f2 | tr '_-' '/+' | awk '{while(length($0)%4)$0=$0"=";print}' | base64 -d | sed 's/alice/mallory/' | base64 | tr '+/' '-_' | tr -d '=\\n')
FAKE="$(echo $AT | cut -d. -f1).$P.$(echo $AT | cut -d. -f3)"
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $FAKE" $OIDC/userinfo
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $AT" $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">401
200</pre></div><div class="read"><b>読み方</b><p>改ざん版が 401、正規版が 200。</p><p>中身は読めても書き換えられない。署名が payload とセットで計算されているため。改ざん版も 200 になったら、サーバーが署名を検証していない環境なので、環境担当に連絡する (通常は起きない)。</p></div></div>`,
        oxIds: [] },
      { id: 'c03-l01-p03', title: `jwt.io に頼らず、トークンの寿命と宛先を一気に読む`,
        html: `<p class="goal">やりたいこと: トークンを受け取ったらまず見る場所を決めておく。誰が (iss)・誰向けに (aud)・いつまで (exp) 発行したかを1コマンドで読む「トークンの診断コマンド」を作る。</p><div class="step"><h4>手順 1　診断関数を追記して Access Token を診断する</h4><p>診断関数を <code>~/develop/kc-handson/kc-lab.sh</code> に追記して読み込み、Access Token を診断する。</p><pre>cat &gt;&gt; ~/develop/kc-handson/kc-lab.sh &lt;&lt; 'EOF'
whois() { jwt "$1" | jq '{typ, iss, aud, azp, sub, preferred_username, scope, iat: (.iat|todate), exp: (.exp|todate), ttl_sec: (.exp-.iat)}'; }
EOF
source ~/develop/kc-handson/kc-lab.sh
AT=$(get_token alice | jq -r .access_token)
whois $AT</pre><div class="check"><b>確認</b><pre class="out">{
  "typ": "Bearer",
  "iss": "http://localhost:8080/realms/demo",
  "aud": "account",
  "azp": "frontend-spa",
  "sub": "…uuid…",
  "preferred_username": "alice",
  "scope": "openid email profile",
  "iat": "2026-…T…Z",
  "exp": "2026-…T…Z",
  "ttl_sec": 300
}</pre></div><div class="read"><b>読み方</b><p>次の形の JSON が出る。</p><p><code>ttl_sec</code> が 300 なら、Access Token は 5 分で切れる (Realm settings → Tokens の既定)。第5章で変更する。</p></div></div><div class="step"><h4>手順 2　ID Token も診断する</h4><p>同じ関数を ID Token にかける。</p><pre>IDT=$(get_token alice | jq -r .id_token)
whois $IDT</pre><div class="check"><b>確認</b><pre class="out">typ が ID、aud が frontend-spa の同じ形の JSON が出る。</pre></div><div class="read"><b>読み方</b><p>ID Token は宛先 (aud) と claim の構成が Access Token と別で、<code>scope</code> が出ない場合もある。同じ値を期待しない。以降の章では、トークンを取ったら必ず <code>whois</code> か <code>jwt</code> で中身を確認する習慣にする。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c03-l02', title: `payload 例と標準 Claim`, pages: [
      { id: 'c03-l02-p01', title: `iss と sub: 「誰が発行」「どのユーザーか」`,
        html: `<p class="goal">やりたいこと: <b>iss</b> はトークンの発行者 (realm の URL)、<b>sub</b> はユーザーを一意に示す ID。API が検証するのは iss の完全一致で、DB の紐付けキーに使うのは email ではなく sub。alice と bob で比べて確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み、alice と bob で <code>get_token</code> が動く。</p><div class="step"><h4>手順 1　alice と bob の sub を比べる</h4><p>alice のトークンを2回、bob のトークンを1回取って <code>sub</code> を読む。さらに管理コンソール「Users」→ <code>alice</code> の「Details」タブの ID (UUID) を見る。</p><pre>A1=$(get_token alice | jq -r .access_token); A2=$(get_token alice | jq -r .access_token)
jwt $A1 | jq -r .sub; jwt $A2 | jq -r .sub
B1=$(get_token bob | jq -r .access_token)
jwt $B1 | jq -r .sub</pre><div class="check"><b>確認</b><pre class="out">5c1d…-…-…        (alice)
5c1d…-…-…        (alice 2回目: 同じ)
e7a0…-…-…        (bob: 違う)</pre></div><div class="read"><b>読み方</b><p>alice の2回は同じ値、bob は違う値。alice の値は管理コンソールの ID と一致する。</p><p><code>sub</code> はユーザーごとに固定で、管理コンソールの User ID と同じ値。email や username は変更できるが <code>sub</code> は変わらないので、アプリの DB の紐付けキーは <code>sub</code>。</p></div></div><div class="step"><h4>手順 2　iss と Discovery の issuer を比べる</h4><p>トークンの <code>iss</code> と Discovery の <code>issuer</code> を比べる。</p><pre>[ "$(jwt $A1 | jq -r .iss)" = "$(curl -s $KC/.well-known/openid-configuration | jq -r .issuer)" ] &amp;&amp; echo "iss == issuer"</pre><div class="check"><b>確認</b><pre class="out">iss == issuer</pre></div><div class="read"><b>読み方</b><p>次の1行が出る。</p><p><code>iss == issuer</code> が出れば、API は Discovery の issuer と完全一致するかで発行元を確かめられる。末尾スラッシュやホスト名の違いも不一致になる。何も表示されないなら不一致なので、ホスト名の揺れ (localhost と 127.0.0.1) を疑う。</p></div></div>`,
        oxIds: [] },
      { id: 'c03-l02-p02', title: `aud と azp: 「誰宛か」と「誰が要求したか」`,
        html: `<p class="goal">やりたいこと: <b>aud</b> は「このトークンは誰宛か」、<b>azp</b> は「トークンを要求したクライアント」。API は自分の名前が aud に無いトークンを拒否する。混同しやすい2つの違いを、ID Token と Access Token で比べて確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Direct access grants On)。</p><div class="step"><h4>手順 1　Access Token と ID Token の aud / azp を比べる</h4><p>1回のログインで取った2つのトークンから <code>aud</code> / <code>azp</code> を読む。</p><pre>T=$(get_token alice)
jwt $(echo $T | jq -r .access_token) | jq -c '{aud, azp}'
jwt $(echo $T | jq -r .id_token) | jq -c '{aud, azp}'</pre><div class="check"><b>確認</b><pre class="out">{"aud":"account","azp":"frontend-spa"}
{"aud":"frontend-spa","azp":"frontend-spa"}</pre></div><div class="read"><b>読み方</b><p>2行が出る。</p><p>aud = 宛先 (誰が受け取るか)、azp = 要求者 (誰が取りに行ったか)。Access Token は <code>aud</code> が <code>account</code>、<code>azp</code> が <code>frontend-spa</code> で別物。SPA が API 向けのトークンを取れば <code>azp=frontend-spa</code>、<code>aud=API の名前</code> になる。ID Token の <code>aud</code> は発行先の client_id で、検証するのは Client 自身。</p></div></div><div class="step"><h4>手順 2　管理コンソールの Evaluate と比べる</h4><p>管理コンソールで <code>frontend-spa</code> →「Client scopes」→「Evaluate」→ Users に <code>alice</code> を入れ、「Generated access token」を開く。</p><div class="check"><b>確認</b><pre class="out">aud が手順1の Access Token と一致する。</pre></div><div class="read"><b>読み方</b><p>Evaluate は「そのユーザー・そのクライアントで発行されるトークン」のプレビュー。</p></div></div><div class="step"><h4>手順 3　API の aud 検証をシェルで再現する</h4><p>本物の API は第8章で作る。ここでは aud に <code>api-service</code> が含まれるかを調べる。</p><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq '{aud, has_api_service: ((.aud | tostring) | contains("api-service"))}'</pre><div class="check"><b>確認</b><pre class="out">aud に api-service が無いので has_api_service は false。</pre></div><div class="read"><b>読み方</b><p><code>false</code> なら、API が自分 (<code>api-service</code>) の名前を aud に要求する場合、このトークンは拒否される (本物の API では 401)。トークンの使い回し (Confused Deputy) を防ぐ仕組みで、直し方は第4章で Audience Mapper を足す。<code>true</code> になったなら、すでに aud に <code>api-service</code> が含まれている (第4章を済ませているなど)。</p></div></div>`,
        oxIds: [] },
      { id: 'c03-l02-p03', title: `exp と iat: 有効期限を時刻に直し、期限切れを体験する`,
        html: `<p class="goal">やりたいこと: <b>exp</b> は有効期限、<b>iat</b> は発行時刻 (どちらも UNIX 秒)。トークンが期限切れになるとどう見えるかを、introspection と API の応答で確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Direct access grants On)、<code>api-service</code> と <code>$API_SECRET</code> が用意済み。</p><div class="step"><h4>手順 1　発行時刻と期限を読める形にする</h4><p>iat / exp を時刻にし、現在時刻との差 (残り秒数) を出す。</p><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq '{iat: (.iat|todate), exp: (.exp|todate), ttl: (.exp-.iat)}'
date -u
echo $(( $(jwt $AT | jq .exp) - $(date +%s) )) 秒</pre><div class="check"><b>確認</b><pre class="out">{ "iat": "…T10:00:00Z", "exp": "…T10:05:00Z", "ttl": 300 }</pre></div><div class="read"><b>読み方</b><p>iat / exp / ttl が出る。</p><p><code>exp - iat</code> がそのまま寿命で、<code>ttl</code> が 300 なら Access Token の寿命は5分。</p></div></div><div class="step"><h4>手順 2　期限前と期限後で introspection と userinfo を比べる</h4><p>いまの有効性を introspection で見てから、約 5.5 分待って、同じトークンで introspection と userinfo を呼ぶ。</p><pre>curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq .active
sleep 330
curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq .active
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $AT" $OIDC/userinfo</pre><div class="check"><b>確認</b><pre class="out">true
(5.5分後)
false
401</pre></div><div class="read"><b>読み方</b><p>待つ前は <code>true</code>、待った後は <code>false</code> と 401。</p><p>5分後に <code>active: false</code> / 401 なら、期限切れのトークンは Keycloak もリソース側も拒否する。続けるには Refresh Token (第9章) で取り直す。</p><ul><li>期限前なのに 401 なら PC の時計ズレ。<code>exp</code> / <code>nbf</code> の検証は時計に依存するため、サーバー間の時刻同期が重要。</li><li>待たずに済ませたい場合は、第5章で Access Token Lifespan を 1 分にしてから同じ手順を行う。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c03-l02-p04', title: `scope・sid・typ・jti など、その他の標準 Claim`,
        html: `<p class="goal">やりたいこと: 標準 claim には、<code>scope</code> (許可された範囲)、<code>sid</code> (セッション ID)、<code>jti</code> (トークン固有 ID)、<code>acr</code> (認証強度) などがある。実トークンで探し、scope の要求値でどう変わるかを確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Direct access grants On)。</p><div class="step"><h4>手順 1　scope を変えて比べる</h4><p>scope の要求値を変えて、Access Token の <code>scope</code> claim を見る。</p><pre>for s in "" "email" "profile email"; do get_token alice "$s" | jq -r .access_token | { read t; jwt $t | jq -c '{scope}'; }; done</pre><div class="check"><b>確認</b><pre class="out">{"scope":"openid email profile"}
{"scope":"openid email profile"}
{"scope":"openid email profile"}</pre></div><div class="read"><b>読み方</b><p>3回とも同じ値が出る。</p><p>scope を変えても同じなのは、<code>email</code> / <code>profile</code> が frontend-spa の Default Scope で、リクエストに書かなくても常に付くため (第4章)。</p></div></div><div class="step"><h4>手順 2　その他の標準 claim を一覧にする</h4><p>他の標準 claim を取り出す。</p><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq '{typ, sid, jti, acr, auth_time, nbf}'</pre><div class="check"><b>確認</b><pre class="out">{ "typ": "Bearer", "sid": "…", "jti": "…", "acr": "1" }</pre></div><div class="read"><b>読み方</b><p><code>auth_time</code> と <code>nbf</code> は環境で出ないこともあり、次の項目が読める。</p><p><code>acr</code> が <code>1</code> なら通常のパスワード認証。MFA 済みだと値が上がる (第10章)。</p></div></div><div class="step"><h4>手順 3　取り直した sid / jti を比べる</h4><p>2回取り直して <code>sid</code> / <code>jti</code> を比べ、管理コンソール「Sessions」で alice の行数を先に控えておき、取り直したあとで増えていることも確認する。</p><pre>for i in 1 2; do jwt $(get_token alice | jq -r .access_token) | jq -c '{sid, jti}'; done</pre><div class="check"><b>確認</b><pre class="out">{"sid":"aaaa…","jti":"1111…"}
{"sid":"bbbb…","jti":"2222…"}</pre></div><div class="read"><b>読み方</b><p>どちらも毎回違う値になる。</p><p><code>jti</code> はトークン1枚ごとの固有 ID で、リプレイ検知や失効管理に使う。<code>sid</code> が毎回違うのは、<code>get_token</code> がパスワード認証のたびに別セッションを作るため (Sessions に行が増える)。ブラウザでログインして取り直した場合は同じ <code>sid</code> になる。</p></div></div>`,
        oxIds: [] },
      { id: 'c03-l02-p05', title: `name・email などユーザー情報の claim`,
        html: `<p class="goal">やりたいこと: <code>preferred_username</code>・<code>email</code>・<code>name</code> などのユーザー情報 claim が、どの scope のおかげでトークンに入るのかを確かめ、出ないときに最初に疑う場所を押さえる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Direct access grants On)。</p><div class="step"><h4>手順 1　ID Token のユーザー情報 claim を取る</h4><p>ID Token からユーザー情報 claim を取り出す。</p><pre>IDT=$(get_token alice | jq -r .id_token)
jwt $IDT | jq '{preferred_username, name, given_name, family_name, email, email_verified}'</pre><div class="check"><b>確認</b><pre class="out">alice の名前とメールが出る (name は Alice Example)。</pre></div><div class="read"><b>読み方</b><p>bob (Email verified Off) では <code>email_verified</code> が false になる。確かめるには <code>CLIENT=frontend-spa; jwt $(get_token bob | jq -r .id_token) | jq .email_verified</code>。</p></div></div><div class="step"><h4>手順 2　First name を書き換えて取り直す</h4><p>管理コンソール「Users」→ <code>alice</code> →「Details」で First name を <code>Alicia</code> に書き換えて「Save」。取り直す。</p><pre>IDT=$(get_token alice | jq -r .id_token)
jwt $IDT | jq '{name, given_name, family_name}'</pre><div class="check"><b>確認</b><pre class="out">(Save 前)  { "name": "Alice Example", "given_name": "Alice", "family_name": "Example" }
(Save 後)  { "name": "Alicia Example", "given_name": "Alicia", "family_name": "Example" }</pre></div><div class="read"><b>読み方</b><p>Save 前後で次のように変わる。</p><p><code>name</code> / <code>given_name</code> が変わったなら、claim の値の元は Keycloak 上のユーザー属性。元を直せば、次に発行するトークンから変わる。</p></div></div><div class="step"><h4>手順 3　email スコープを外して取り直す</h4><p>管理コンソールで <code>frontend-spa</code> →「Client scopes」タブの <code>email</code> を一時的に外し (「Remove」)、取り直す。確認後、<code>email</code> を「Add client scope」で Default として戻す。</p><pre>IDT=$(get_token alice | jq -r .id_token)
jwt $IDT | jq '{email, email_verified}'</pre><div class="check"><b>確認</b><pre class="out">{ "email": null, "email_verified": null }</pre></div><div class="read"><b>読み方</b><p>手順 1 で出ていた <code>email</code> が消える。</p><p><code>email</code> スコープを外すと <code>email</code> / <code>email_verified</code> が消えるので、claim を載せているのは Client Scope の Mapper。claim が出ないときは Client scopes の割り当てと Mapper の「Add to ID/access token」を見る (第4章)。戻したのに出ないなら、Default ではなく Optional で追加しているので、もう一度 Default にする。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c03-l03', title: `Keycloak 独自 Claim・読み方`, pages: [
      { id: 'c03-l03-p01', title: `realm_access / resource_access / allowed-origins を読む`,
        html: `<p class="goal">やりたいこと: Keycloak 独自の claim (<code>realm_access</code> = Realm Role、<code>resource_access</code> = Client Role、<code>allowed-origins</code> = Web Origins) を読み、管理コンソールの操作がトークンにどう反映されるかを確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、alice に Realm Role <code>user</code>・<code>admin</code> が付与済み、<code>frontend-spa</code> の Web origins が <code>http://localhost:3000</code>。</p><div class="step"><h4>手順 1　独自 claim を取り出す</h4><p>独自 claim だけを取り出す。</p><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq '{realm_access, resource_access, "allowed-origins"}'</pre><div class="check"><b>確認</b><pre class="out">{
  "realm_access": { "roles": ["default-roles-demo", "offline_access", "uma_authorization", "user", "admin"] },
  "resource_access": { "account": { "roles": ["manage-account", "manage-account-links", "view-profile"] } },
  "allowed-origins": ["http://localhost:3000"]
}</pre></div><div class="read"><b>読み方</b><p>次の形の JSON が出る。ロールの並び順は毎回同じとは限らない。</p><p>Client Role は <code>resource_access.&lt;client&gt;.roles</code> に入る。第4章で <code>api-service</code> の Client Role を作って現れるのを見る。<code>allowed-origins</code> が Web origins の値なら、設定がそのまま claim になっている (第5章)。</p></div></div><div class="step"><h4>手順 2　admin ロールを外して取り直す</h4><p>管理コンソール「Users」→ <code>alice</code> →「Role mapping」で <code>admin</code> を外し (「Unassign」)、取り直す。</p><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq .realm_access.roles</pre><div class="check"><b>確認</b><pre class="out">["default-roles-demo","offline_access","uma_authorization","user"]</pre></div><div class="read"><b>読み方</b><p>手順 1 で出ていた <code>admin</code> が消える。</p><p>管理コンソールで付けた/外した Realm Role は、次に発行するトークンから反映される。すでに発行済みのトークンは変わらない。ロールを外した直後に API が通ってしまうのは、発行済みトークンが期限 (5分) まで有効なため。即時反映したいときは introspection (第8章)。</p></div></div><div class="step"><h4>手順 3　admin を戻して Evaluate と見比べる</h4><p><code>admin</code> を再び付ける (「Assign role」)。管理コンソール <code>frontend-spa</code> →「Client scopes」→「Evaluate」で、Users に <code>alice</code> を選び、「Generated access token」を開く。</p><div class="check"><b>確認</b><pre class="out">Generated access token の claim が、curl で取った結果と一致する。</pre></div><div class="read"><b>読み方</b><p>Evaluate は「そのユーザー・そのクライアントで発行されるトークン」のプレビュー。claim が出ない原因調査の最初の道具になる。</p></div></div><div class="step"><h4>手順 4　ロール名だけ確認する書き方を覚える</h4><p>jq でロール名を1行ずつ出す。</p><pre>jwt $AT | jq -r '.realm_access.roles[]'
jwt $AT | jq -r '.resource_access | to_entries[] | .key as $c | .value.roles[] | "\\($c): \\(.)"'</pre><div class="check"><b>確認</b><pre class="out">Realm Role の名前が1行ずつ、続けて クライアント名: ロール名 の形で Client Role が出る。</pre></div><div class="read"><b>読み方</b><p><code>admin</code> が有るか無いかを見るのに、JSON 全体を読むより速い。以降のトークン診断の型として使う。</p></div></div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
// 第4章 ハンズオン形式
DATA.chapters.push({
  no: 4, title: `Client Scope と Mapper`,
  lessons: [
    { id: 'c04-l01', title: `3部品の関係・Client Scope・Default/Optional`, pages: [
      { id: 'c04-l01-p01', title: `Client → Client Scope → Mapper の3段を管理コンソールでたどる`,
        html: `<p class="goal">やりたいこと: 「どのユーザー情報を、どの名前で、どのトークンに入れるか」は <b>Mapper</b> (claim 1個を作る部品) → <b>Client Scope</b> (Mapper のセット) → <b>Client</b> (どのセットを使うか選ぶ) の3段で決まる。この3段をたどって claim の出どころを特定する。 前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> が作成済み (Clients に <code>frontend-spa</code> がある)。</p>
<div class="step">
<h4>手順 1　Client に割り当てられたスコープを読む</h4>
<p>管理コンソールで「Clients」→ <code>frontend-spa</code> →「Client scopes」タブを開き、一覧の Assigned type (Default / Optional) と名前を読む。</p>
<div class="check"><b>確認</b>
<pre class="out">frontend-spa-dedicated   Dedicated scope and mappers for this client
acr                      Default
basic                    Default
email                    Default
profile                  Default
roles                    Default
web-origins              Default
address                  Optional
microprofile-jwt         Optional
organization             Optional
offline_access           Optional
phone                    Optional</pre></div>
<div class="read"><b>読み方</b>
<p>Assigned type が Default のものは、リクエストに書かなくても毎回適用される (次ページ以降で確認)。一覧が空に近いなら Client の作成途中で、作り直すか「Add client scope」で追加する。</p></div>
</div>
<div class="step">
<h4>手順 2　スコープの Mapper と claim を突き合わせる</h4>
<p><code>email</code> をクリックして「Mappers」タブで Mapper 名を読み、<code>email</code> Mapper の User Attribute / Token Claim Name / 「Add to ID token」等の設定を読む。そのうえでトークンを取る。</p>
<pre>IDT=$(get_token alice | jq -r .id_token)
jwt $IDT | jq '{email, email_verified}'</pre>
<div class="check"><b>確認</b>
<pre class="out">Token Claim Name が email で、トークンにも email が出る。</pre></div>
<div class="read"><b>読み方</b>
<p>Token Claim Name が <code>email</code> で、トークンにも <code>email</code> が出たなら、「Client が email スコープを使う → スコープの Mapper が email claim を作る」の対応が1本つながったということ。同じ設定を Client ごとに作り直さず、Client Scope として使い回せる。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l01-p02', title: `Client Scope を自作し、Hardcoded claim の Mapper を入れる`,
        html: `<p class="goal">やりたいこと: 自分の Client Scope <code>company-info</code> を作り、中に「誰でも同じ固定値 <code>tenant=acme</code> を入れる Mapper」を置く。作り方を一通り体験する。</p>
<div class="step">
<h4>手順 1　Client Scope を作る</h4>
<p>左メニュー「Client scopes」→「Create client scope」を押し、Name = <code>company-info</code>、Type = <code>None</code>、Protocol = <code>OpenID Connect</code>、Include in token scope = <code>On</code> で「Save」を押す。</p>
<div class="check"><b>確認</b>
<pre class="out">Client scopes 一覧に company-info が出る。</pre></div>
<div class="read"><b>読み方</b>
<p>Type が <code>None</code> なら realm の新規クライアントに自動では付かない。Default / Optional にすると新規クライアントすべてに自動で付く (影響範囲が広いので、学習では None で作る)。</p></div>
</div>
<div class="step">
<h4>手順 2　Hardcoded claim の Mapper を入れる</h4>
<p><code>company-info</code> の「Mappers」タブ →「Configure a new mapper」→「Hardcoded claim」を選ぶ。Name = <code>tenant-hardcoded</code>、Token Claim Name = <code>tenant</code>、Claim value = <code>acme</code>、Claim JSON Type = <code>String</code> を入力し、「Add to ID token」「Add to access token」「Add to userinfo」を On にして「Save」を押す。</p>
<pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq .tenant</pre>
<div class="check"><b>確認</b>
<pre class="out">null</pre></div>
<div class="read"><b>読み方</b>
<p>Mapper 一覧に <code>tenant-hardcoded</code> (Type: Hardcoded claim) が1行できる。まだ <code>frontend-spa</code> に割り当てていないので、トークンを見る。</p><p><code>null</code> なら、Client Scope を作っただけではどの Client のトークンにも載らない。Client に割り当てて初めて効く。</p><ul><li>「Hardcoded claim」が見つからない: 「Configure a new mapper」ではなく「Add predefined mapper」を押している。</li><li>Name は管理画面の表示名だけで、claim の名前は <b>Token Claim Name</b> で決まる。</li></ul></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l01-p03', title: `Default として割り当てる: リクエストに書かなくても claim が載る`,
        html: `<p class="goal">やりたいこと: 作った <code>company-info</code> を <code>frontend-spa</code> に <b>Default Scope</b> として割り当て、scope をリクエストに書かなくても <code>tenant</code> が毎回載ることを確認する。前提: Client scopes に <code>company-info</code> (Mapper で <code>tenant</code> claim を出すもの) が作成済み。</p>
<div class="step">
<h4>手順 1　Default で割り当てる</h4>
<p>「Clients」→ <code>frontend-spa</code> →「Client scopes」タブ →「Add client scope」を押し、<code>company-info</code> にチェックして「Add」→「Default」を選ぶ。</p>
<pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq '{tenant, scope}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "tenant": "acme", "scope": "openid email profile company-info" }</pre></div>
<div class="read"><b>読み方</b>
<p><code>tenant: "acme"</code> が出て <code>scope</code> に <code>company-info</code> も含まれるなら、Default は scope パラメータに書かなくても適用され、名前も <code>scope</code> claim に載る (Include in token scope = On のため)。</p><ul><li><code>scope</code> に名前が出ず <code>tenant</code> だけ出る: Include in token scope が Off。</li><li><code>tenant</code> が出ない: 「Add」時に Optional を選んだか、Mapper の「Add to access token」が Off。</li></ul></div>
</div>
<div class="step">
<h4>手順 2　Evaluate で管理コンソールからも確かめる</h4>
<p>管理コンソールの「Client scopes」→「Evaluate」で Users = <code>alice</code> を入れる。</p>
<div class="check"><b>確認</b>
<pre class="out">「Generated access token」に tenant がある。</pre></div>
<div class="read"><b>読み方</b>
<p><code>tenant</code> があれば、コマンドで取ったトークンと同じ結果。claim の調査では Evaluate が最初の一手になる。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l01-p04', title: `Optional に変えて、要求したときだけ載ることを確かめる`,
        html: `<p class="goal">やりたいこと: <b>Optional Scope</b> は、リクエストの <code>scope=</code> に名前を書いたときだけ適用される。機微な情報やたまにしか要らない情報は Optional にして、必要な時だけ要求させる。「リクエストの <code>scope=company-info</code> が、Keycloak 上の同名の Client Scope を呼び出す」ことを確かめる。</p>
<div class="step">
<h4>手順 1　Optional に変えて、指定なしと指定ありを比べる</h4>
<p><code>frontend-spa</code> の「Client scopes」タブで <code>company-info</code> の Assigned type を <code>Default</code> から <code>Optional</code> に変更する (行の種別ドロップダウンで切り替え)。続けて scope なしと <code>scope=company-info</code> ありでトークンを取る。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{tenant, scope}'
jwt $(get_token alice company-info | jq -r .access_token) | jq '{tenant, scope}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "tenant": null, "scope": "openid email profile" }
{ "tenant": "acme", "scope": "openid email profile company-info" }</pre></div>
<div class="read"><b>読み方</b>
<p>指定なしで <code>tenant</code> が出ず、指定すると出るなら、Optional は要求した時だけ適用されるということ。指定したのに出ないときは、Optional として割り当てたか、<code>scope=</code> の綴りを確認する。</p></div>
</div>
<div class="step">
<h4>手順 2　存在しないスコープを指定する</h4>
<pre>get_token alice no-such-scope | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "invalid_scope", "error_description": "Invalid scopes: openid no-such-scope" }</pre></div>
<div class="read"><b>読み方</b>
<p>未割り当て/未定義のスコープ名で <code>invalid_scope</code> になるなら、リクエストの <code>scope</code> は、その Client に割り当てられた Client Scope 名を指す文字列だということ。scope という言葉には2つの意味がある (OAuth の scope パラメータという文字列と、Keycloak の Client Scope という設定の実体) ので、名前が一致して初めて結びつく。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l01-p05', title: `scope orders:read を作り、API の scope 検査を再現する`,
        html: `<p class="goal">やりたいこと: スコープは API の認可にも使える。後で作る API の <code>/orders</code> は scope <code>orders:read</code> を要求する。このスコープを自作して <code>frontend-spa</code> に割り当て、トークンの <code>scope</code> に載る/載らないで「API なら通る/通らない」が変わるのを確かめる。第8・9章でも使う。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　スコープを作り、割り当て前の検査を再現する</h4>
<p>「Client scopes」→「Create client scope」で Name = <code>orders:read</code>、Type = <code>None</code>、Protocol = <code>OpenID Connect</code>、Include in token scope = <code>On</code> として「Save」を押す。そのうえで API が行う検査 (scope に <code>orders:read</code> があるか) を再現する。</p>
<pre>has_scope() { jwt "$1" | jq --arg s "$2" '(.scope | split(" ") | index($s)) != null'; }
AT=$(get_token alice | jq -r .access_token)
has_scope $AT orders:read</pre>
<div class="check"><b>確認</b>
<pre class="out">false</pre></div>
<div class="read"><b>読み方</b>
<p><code>false</code> は、API が検査すると 403 になる状態。トークンは有効 (認証は通る) だが、<code>scope</code> に <code>orders:read</code> が無く認可で拒否される。401 (誰か分からない) と 403 (誰かは分かったが権限不足) の違い。</p></div>
</div>
<div class="step">
<h4>手順 2　Optional で割り当て、要求したときだけ載ることを確かめる</h4>
<p><code>frontend-spa</code> →「Client scopes」→「Add client scope」で <code>orders:read</code> を <code>Optional</code> として追加し、要求なしと要求ありで検査する。</p>
<pre>has_scope $(get_token alice | jq -r .access_token) orders:read
has_scope $(get_token alice orders:read | jq -r .access_token) orders:read</pre>
<div class="check"><b>確認</b>
<pre class="out">false
true</pre></div>
<div class="read"><b>読み方</b>
<p><code>scope=orders:read</code> を要求したときだけ <code>true</code> なら、API の認可は Keycloak のスコープ割り当てとリクエストの scope の両方で決まるということ。Optional なので要求しなければ <code>false</code> のままで、必要な時だけ権限を渡す最小権限の形になる (Default にすると常に載る)。第8章で自作 API にこの検査をさせ、403 / 200 を確かめる。</p><ul><li><code>get_token alice orders:read</code> が <code>invalid_scope</code>: スコープを作っただけで Client に割り当てていない。</li></ul></div>
</div>`,
        oxIds: [] },
    ] },
    { id: 'c04-l02', title: `標準 Client Scope・Dedicated`, pages: [
      { id: 'c04-l02-p01', title: `標準 Client Scope の役割を、外して確かめる`,
        html: `<p class="goal">やりたいこと: realm 作成時から入っている標準 Client Scope (<code>profile</code> / <code>email</code> / <code>roles</code> / <code>web-origins</code> / <code>basic</code> / <code>acr</code> など) の担当を、1つずつ外して消える claim で確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　roles を外して差を見る</h4>
<p>外す前の claim を保存し、管理コンソール <code>frontend-spa</code> →「Client scopes」で <code>roles</code> の行を選び「Remove」を押してから、取り直して差を見る。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq 'keys' &gt; /tmp/before.json
(roles を Remove)
jwt $(get_token alice | jq -r .access_token) | jq 'keys' &gt; /tmp/after.json
diff /tmp/before.json /tmp/after.json</pre>
<div class="check"><b>確認</b>
<pre class="out">&lt; "aud",
&lt; "realm_access",
&lt; "resource_access",</pre></div>
<div class="read"><b>読み方</b>
<p>roles は <code>realm_access</code> / <code>resource_access</code> を載せる (Audience Resolve もここ)。外すと API が role 認可できない。確認後、<code>roles</code> を Default で戻す (「Add client scope」→ <code>roles</code> → Default)。</p></div>
</div>
<div class="step">
<h4>手順 2　web-origins を外して差を見る</h4>
<p>外す前の claim を保存し、管理コンソール <code>frontend-spa</code> →「Client scopes」で <code>web-origins</code> の行を選び「Remove」を押してから、取り直して差を見る。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq 'keys' &gt; /tmp/before.json
(web-origins を Remove)
jwt $(get_token alice | jq -r .access_token) | jq 'keys' &gt; /tmp/after.json
diff /tmp/before.json /tmp/after.json</pre>
<p>確認後、<code>web-origins</code> を Default で戻す (「Add client scope」→ <code>web-origins</code> → Default)。</p>
<div class="check"><b>確認</b>
<pre class="out">&lt; "allowed-origins",</pre></div>
<div class="read"><b>読み方</b>
<p>web-origins は <code>allowed-origins</code> (CORS 用) を載せる。</p></div>
</div>
<div class="step">
<h4>手順 3　profile を外して差を見る</h4>
<p>同じ方法で <code>profile</code> を外して diff を取り、戻す。</p>
<div class="check"><b>確認</b>
<pre class="out">&lt; "family_name", "given_name", "name", "preferred_username" ...</pre></div>
<div class="read"><b>読み方</b>
<p>profile は <code>name</code> / <code>preferred_username</code> など名前系の担当 (email スコープは <code>email</code> / <code>email_verified</code>)。<code>openid</code> は実体の Client Scope としては見えず、scope に書く特別な宣言で、これが無いと ID Token が返らない (<code>get_token</code> は自動で <code>openid</code> を付ける)。戻し忘れると後の章の claim が足りなくなるので、章を進める前に <code>frontend-spa</code> の Client scopes 一覧に <code>acr</code> / <code>basic</code> / <code>email</code> / <code>profile</code> / <code>roles</code> / <code>web-origins</code> が Default で並んでいるか確認する。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l02-p02', title: `Optional な標準スコープ: offline_access と phone`,
        html: `<p class="goal">やりたいこと: <code>offline_access</code> や <code>phone</code> は frontend-spa では Optional。要求したときだけ効く標準スコープの例として、長期間使える Offline Token が発行される様子を確認する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> に <code>offline_access</code> と <code>phone</code> が Optional で割り当て済み (既定)。</p>
<div class="step">
<h4>手順 1　offline_access を要求して Refresh Token の typ を比べる</h4>
<p>通常と <code>offline_access</code> 要求時で Refresh Token の <code>typ</code> を見る。</p>
<pre>jwt $(get_token alice | jq -r .refresh_token) | jq -c '{typ, exp: (.exp|todate)}'
jwt $(get_token alice offline_access | jq -r .refresh_token) | jq -c '{typ, exp}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{"typ":"Refresh","exp":"…(約30分後)"}
{"typ":"Offline","exp":null}    (※ exp が無い、または非常に遠い)</pre></div>
<div class="read"><b>読み方</b>
<p><code>typ: Offline</code> が出れば、<code>offline_access</code> を要求したときだけ長期 Refresh Token (Offline Token) になるということ。管理コンソール「Sessions」には Offline セッションが別に増える (Type が Offline)。</p></div>
</div>
<div class="step">
<h4>手順 2　phone を要求して claim を見る</h4>
<pre>jwt $(get_token alice phone | jq -r .access_token) | jq '{scope, phone_number}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "scope": "openid email phone profile", "phone_number": null }</pre></div>
<div class="read"><b>読み方</b>
<p>scope には載るが <code>phone_number</code> が null なら、スコープは「載せてよい範囲」であり、元データ (ユーザー属性 <code>phoneNumber</code>) が無いと claim は出ないということ。要求して <code>invalid_scope</code> になるなら、そのスコープが <code>frontend-spa</code> に割り当てられていない。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l02-p03', title: `Dedicated scope: そのクライアント専用の Mapper を置く`,
        html: `<p class="goal">やりたいこと: 各 Client に自動で1つある <code>&lt;client名&gt;-dedicated</code> スコープは、他の Client と共有しない Mapper の置き場所。<code>frontend-spa</code> だけに <code>channel=spa</code> を載せ、他のクライアントに影響しないことを確認する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　dedicated に Mapper を置く</h4>
<p>「Clients」→ <code>frontend-spa</code> →「Client scopes」タブ → <code>frontend-spa-dedicated</code> を開き、「Mappers」タブの「Configure a new mapper」→「Hardcoded claim」を選ぶ。Name = <code>channel</code>、Token Claim Name = <code>channel</code>、Claim value = <code>spa</code>、Claim JSON Type = <code>String</code>、「Add to access token」On で「Save」を押す。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{channel, tenant}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "channel": "spa", "tenant": null }</pre></div>
<div class="read"><b>読み方</b>
<p><code>channel</code> が出れば Mapper が効いている。<code>tenant</code> が null なのは <code>company-info</code> が Optional のため (<code>frontend-spa</code> に Optional で割り当てた状態)。出ないときは Mapper の「Add to access token」が Off。</p></div>
</div>
<div class="step">
<h4>手順 2　別クライアントで同じユーザーのトークンを比べる</h4>
<pre>CLIENT=admin-cli; jwt $(get_token alice | jq -r .access_token) | jq '{channel}'; CLIENT=frontend-spa</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "channel": null }</pre></div>
<div class="read"><b>読み方</b>
<p>admin-cli では出ないので、dedicated の Mapper はその Client 専用で別 Client には波及しない。共有したい設定は Client Scope に、1クライアントだけの設定は dedicated に置く。</p></div>
</div>`,
        oxIds: [] },
    ] },
    { id: 'c04-l03', title: `Mapper とは・種類`, pages: [
      { id: 'c04-l03-p01', title: `User Property Mapper: 標準項目を別名の claim にする`,
        html: `<p class="goal">やりたいこと: <b>User Property</b> Mapper は、ユーザーの標準項目 (username, email, firstName ...) を好きな名前の claim にする。Token Claim Name を変えると claim 名が変わることを確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　別名の claim を作る</h4>
<p><code>frontend-spa-dedicated</code> →「Mappers」→「Configure a new mapper」→「User Property」を選び、Name = <code>login-name</code>、Property = <code>username</code>、Token Claim Name = <code>login_name</code>、Claim JSON Type = <code>String</code>、「Add to access token」On で「Save」を押す。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{login_name, preferred_username}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "login_name": "alice", "preferred_username": "alice" }</pre></div>
<div class="read"><b>読み方</b>
<p><code>login_name</code> が出れば、Mapper の「Property」(元データ) と「Token Claim Name」(出力名) は別だということ。同じ元データから複数の名前で出せる。<code>preferred_username</code> は <code>profile</code> スコープの別 Mapper が出している。Property の候補に項目が無いときは、独自項目なので次ページの User Attribute を使う。</p></div>
</div>
<div class="step">
<h4>手順 2　ドットでネストさせる</h4>
<p>Token Claim Name を <code>user.login</code> に変えて「Save」し、再び確認する。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{user}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "user": { "login": "alice" } }</pre></div>
<div class="read"><b>読み方</b>
<p><code>.</code> でオブジェクトに入る。名前自体にドットを含めたいときは <code>a\\.b</code> とエスケープする。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l03-p02', title: `User Attribute Mapper: 独自属性 department を claim にする`,
        html: `<p class="goal">やりたいこと: ユーザーに付けた独自の属性 (部署など) を claim にしたい。<b>User Attribute</b> Mapper を使い、alice の <code>department=sales</code> を <code>dept</code> として載せる。</p>
<div class="step">
<h4>手順 1　alice に属性を付ける</h4>
<p>左メニュー「Realm settings」→「General」タブの「Unmanaged Attributes」を <code>Enabled</code> にして「Save」を押す。次に「Users」→ <code>alice</code> →「Attributes」タブで Key = <code>department</code>、Value = <code>sales</code> を追加して「Save」を押す。</p>
<div class="check"><b>確認</b>
<pre class="out">alice の Attributes タブに department = sales が残っている。</pre></div>
<div class="read"><b>読み方</b>
<p>Attributes タブが見えないなら Unmanaged Attributes が Enabled になっていない。Keycloak 26 は宣言していない属性を既定では扱わない。</p></div>
</div>
<div class="step">
<h4>手順 2　Mapper を作って alice と bob で比べる</h4>
<p><code>frontend-spa-dedicated</code> の「Mappers」で「Configure a new mapper」→「User Attribute」を選び、Name = <code>dept</code>、User Attribute = <code>department</code>、Token Claim Name = <code>dept</code>、Claim JSON Type = <code>String</code>、「Add to access token」On で「Save」を押す。</p>
<pre>for u in alice bob; do jwt $(get_token $u | jq -r .access_token) | jq -c '{preferred_username, dept}'; done</pre>
<div class="check"><b>確認</b>
<pre class="out">{"preferred_username":"alice","dept":"sales"}
{"preferred_username":"bob","dept":null}</pre></div>
<div class="read"><b>読み方</b>
<p>alice だけ <code>dept: "sales"</code> なら、Mapper は元データがあるユーザーにだけ claim を出すということ (bob は項目なし)。管理コンソールで属性値を変えると、次に発行するトークンの claim が変わる。Claim JSON Type を <code>int</code> にして値が数値でないとトークン取得が失敗するので、型は値に合わせる (この章の l04 p02 で確認)。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l03-p03', title: `Realm Role / Client Role Mapper: ロールを claim にする`,
        html: `<p class="goal">やりたいこと: ロールは既定で <code>realm_access.roles</code> / <code>resource_access.&lt;client&gt;.roles</code> に入る。API が読みやすいよう Client Role をフラットな <code>roles</code> claim にし、Client Role 自体の作り方も学ぶ。</p>
<div class="step">
<h4>手順 1　Client Role を作って alice に付ける</h4>
<p>「Clients」→ <code>api-service</code> →「Roles」タブ →「Create role」で Role name = <code>read</code> を作り、同様に <code>write</code> も作る。「Users」→ <code>alice</code> →「Role mapping」→「Assign role」→「Filter by clients」に切り替え、<code>api-service</code> の <code>read</code> を割り当てる。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '.resource_access["api-service"]'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "roles": ["read"] }</pre></div>
<div class="read"><b>読み方</b>
<p><code>resource_access</code> を見る。</p><p>ユーザーが持つ Client Role は <code>resource_access</code> に入る。付与していない <code>write</code> は出ない。<code>api-service</code> 自体が出ないときは Full Scope Allowed が Off など、載せるロールが絞られている (l04 p04)。</p></div>
</div>
<div class="step">
<h4>手順 2　User Client Role Mapper でフラットな claim にする</h4>
<p><code>frontend-spa-dedicated</code> の「Mappers」で「User Client Role」を追加する。Name = <code>api-roles</code>、Client ID = <code>api-service</code>、Token Claim Name = <code>api_roles</code>、Multivalued = On、「Add to access token」On で「Save」を押す。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{api_roles}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "api_roles": ["read"] }</pre></div>
<div class="read"><b>読み方</b>
<p>フラットな配列で出たなら、Mapper でロールを任意の claim 名にできるということ。API 側は <code>resource_access</code> の入れ子を読まなくて済む。Multivalued を Off にすると配列でなく単一値 (最初の1個) になるので、ロールは複数ありえるため On にする。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l03-p04', title: `Audience と Audience Resolve: aud に API の名前が入る仕組み`,
        html: `<p class="goal">やりたいこと: API が「<code>aud</code> に自分の名前が無いトークンは拒否」する場合、Keycloak 側で <code>aud</code> に API 名を足す必要がある。方法は (1) ロールから自動で足す <b>Audience Resolve</b>、(2) 固定で足す <b>Audience</b> Mapper の2つ。前者を先に観察する。前提: alice に <code>api-service</code> の Client Role <code>read</code> を付与済み (「Users」→ <code>alice</code> →「Role mapping」で確認)。</p>
<div class="step">
<h4>手順 1　alice と bob の aud を比べる</h4>
<pre>jwt $(get_token alice | jq -r .access_token) | jq -c '{aud}'
jwt $(get_token bob | jq -r .access_token) | jq -c '{aud}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{"aud":["api-service","account"]}      (alice: api-service のロールを持つ)
{"aud":"account"}                        (bob: 持たない)</pre></div>
<div class="read"><b>読み方</b>
<p>ロールを持つ alice だけ <code>aud</code> に <code>api-service</code> が入るなら、Audience Resolve は「ユーザーがロールを持つ Client」を自動で aud に足すということ。設定不要で、<code>roles</code> スコープに最初から入っている (管理コンソール「Client scopes」→ <code>roles</code> →「Mappers」の <code>audience resolve</code>)。</p></div>
</div>
<div class="step">
<h4>手順 2　ロールを外して aud が消えるか見る</h4>
<p>alice の <code>api-service</code> のロールを外してトークンを取り直し、確認後にロール <code>read</code> を付け直す。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq -c '{aud}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{"aud":"account"}                        (alice のロールを外した後)</pre></div>
<div class="read"><b>読み方</b>
<p>ロールを外すと aud から消えるので、権限と宛先が連動している。ロール付与のない全員に固定で入れたいときは Audience Mapper を使う (l04 p03)。付与したのに <code>aud</code> に出ない場合は、<code>roles</code> スコープが Client から外れているか、Full Scope Allowed が Off でロールがトークンの対象外 (l04 p04)。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l03-p05', title: `Group Membership / Hardcoded role など、そのほかの Mapper`,
        html: `<p class="goal">やりたいこと: グループ所属を claim にする <b>Group Membership</b> Mapper を使い、Full group path の On/Off での違いを確かめる。あわせて Mapper の候補一覧から用途を見渡す。</p>
<div class="step">
<h4>手順 1　グループを作り、Mapper を追加する</h4>
<p>左メニュー「Groups」→「Create group」で <code>company</code> を作り、その中に子グループ <code>dev</code> を作る。「Users」→ <code>alice</code> →「Groups」タブ →「Join Group」で <code>company/dev</code> に参加させる。<code>frontend-spa-dedicated</code> の「Mappers」で「Group Membership」を追加し、Name = <code>groups</code>、Token Claim Name = <code>groups</code>、Full group path = <code>On</code>、「Add to access token」On で「Save」を押す。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{groups}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "groups": ["/company/dev"] }      (Full group path On)</pre></div>
<div class="read"><b>読み方</b>
<p><code>/company/dev</code> と階層つきで出ればよい。<code>groups</code> が出ないときは、alice がグループに参加していないか「Add to access token」が Off。</p></div>
</div>
<div class="step">
<h4>手順 2　Full group path を Off にして比べる</h4>
<p>Full group path を <code>Off</code> にして「Save」し、再び確認する。</p>
<div class="check"><b>確認</b>
<pre class="out">{ "groups": ["dev"] }               (Full group path Off)</pre></div>
<div class="read"><b>読み方</b>
<p>Off は最下層の名前だけになる。同名の別階層グループがある場合は On にしないと区別できない。</p></div>
</div>
<div class="step">
<h4>手順 3　Mapper の候補一覧を眺める</h4>
<p>「Configure a new mapper」の候補一覧を開き、Mapper Type の名前を読む。</p>
<div class="check"><b>確認</b>
<pre class="out">Hardcoded role / Role Name Mapper / Full name / SHA-256 Pairwise sub などが並んでいる。</pre></div>
<div class="read"><b>読み方</b>
<p>Hardcoded role はユーザーに付与なしでロールをトークンに足す、Role Name Mapper は名前の置換、SHA-256 Pairwise sub は <code>sub</code> をクライアントごとに別値にする。やりたいこと (固定値/名前変更/合成) から探す。Script Mapper は既定で無効・非推奨なので通常は使わない。</p></div>
</div>`,
        oxIds: [] },
    ] },
    { id: 'c04-l04', title: `Mapper 設定項目・具体例・Full Scope Allowed・Lightweight`, pages: [
      { id: 'c04-l04-p01', title: `「Add to ...」のチェックで、載るトークンが変わる`,
        html: `<p class="goal">やりたいこと: Mapper の「Add to ID token / access token / userinfo / token introspection」のチェックが、claim がどこに載るかを決める。<code>tenant</code> claim で4つの出口を確認し、「claim が出ない」ときの最初の疑いどころを体得する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>api-service</code> の secret は <code>$API_SECRET</code>。</p>
<div class="step">
<h4>手順 1　ID token と access token だけ On にして4つの出口を調べる</h4>
<p><code>frontend-spa</code> の「Client scopes」で <code>company-info</code> を Default に戻す。<code>company-info</code> の Mapper <code>tenant-hardcoded</code> で、ID token と access token だけ On、userinfo と token introspection は Off にして「Save」を押し、次を実行する。</p>
<pre>T=$(get_token alice)
AT=$(echo $T | jq -r .access_token); IDT=$(echo $T | jq -r .id_token)
echo "access: $(jwt $AT | jq -r .tenant)  id: $(jwt $IDT | jq -r .tenant)"
echo "userinfo: $(curl -s -H "Authorization: Bearer $AT" $OIDC/userinfo | jq -r .tenant)"
echo "introspect: $(curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq -r .tenant)"</pre>
<div class="check"><b>確認</b>
<pre class="out">access: acme  id: acme  userinfo: null  introspect: null</pre></div>
<div class="read"><b>読み方</b>
<p>userinfo / introspect だけ出ないのは、その出口の「Add to ...」が Off だから。claim の有無は Mapper のチェックで決まる。</p></div>
</div>
<div class="step">
<h4>手順 2　userinfo と introspection も On にする</h4>
<p>「Add to userinfo」と「Add to token introspection」を On にして「Save」し、同じコマンドを再実行する。</p>
<div class="check"><b>確認</b>
<pre class="out">access: acme  id: acme  userinfo: acme  introspect: acme</pre></div>
<div class="read"><b>読み方</b>
<p>4つとも <code>acme</code> なら、チェックを On にした出口すべてに載っているということ。</p></div>
</div>
<div class="step">
<h4>手順 3　access token を Off にする</h4>
<p>「Add to access token」を Off にして「Save」し、同じコマンドを再実行する。</p>
<div class="check"><b>確認</b>
<pre class="out">access: null  id: acme  userinfo: acme  introspect: acme</pre></div>
<div class="read"><b>読み方</b>
<p>access だけ null なら、Access Token (API 用) には載せず ID Token (アプリ用) にだけ載せる設計もできるということ。introspect は Access Token の claim とは別に判定されるので、access が Off でも acme が出る。「claim が出ない」ときは、Client に scope が付いている → Mapper がある →「Add to ...」が On、の順に確認する。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l04-p02', title: `Claim JSON Type と Multivalued: 型を間違えると何が起きるか`,
        html: `<p class="goal">やりたいこと: claim の値の型 (<b>Claim JSON Type</b>) や <b>Multivalued</b> を間違えると API 側のパースが失敗する。値を変えて、型が JSON にどう反映されるかを確認する。</p>
<div class="step">
<h4>手順 1　String と int を比べる</h4>
<p><code>company-info</code> の <code>tenant-hardcoded</code> を開き、Claim value = <code>1</code>、Claim JSON Type = <code>String</code> で保存して確認する。続けて Claim JSON Type = <code>int</code> に変えて保存し、同様に確認する。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '.tenant | type, .'</pre>
<div class="check"><b>確認</b>
<pre class="out">"string"  "1"
"number"  1</pre></div>
<div class="read"><b>読み方</b>
<p><code>String</code> では <code>"1"</code>、<code>int</code> では <code>1</code>。見た目が同じでも JSON 上の型が違い、API が数値を期待しているのに文字列だと比較やパースで落ちる。値と型が合わない設定 (例: <code>acme</code> を <code>int</code>) にすると、トークン取得そのものが <code>{"error":"unknown_error", ...}</code> で失敗する (そのクライアントでのログイン全体が止まる)。</p></div>
</div>
<div class="step">
<h4>手順 2　boolean と JSON を試す</h4>
<p>Claim value = <code>true</code>、Claim JSON Type = <code>boolean</code> に変えて確認する。次に Claim value = <code>["a","b"]</code>、Claim JSON Type = <code>JSON</code> に変えて確認する。</p>
<div class="check"><b>確認</b>
<pre class="out">"boolean" true
"array"   ["a","b"]</pre></div>
<div class="read"><b>読み方</b>
<p><code>JSON</code> を選ぶと配列やオブジェクトを丸ごと入れられる。Multivalued は、ロールやグループのように複数値の元データを配列で出すときの設定 (ロールやグループの Mapper で On にするもの)。確認後、元の <code>acme</code> / <code>String</code> に戻す。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l04-p03', title: `具体例: API が aud=api-service を要求して拒否される → 直す`,
        html: `<p class="goal">やりたいこと: 実務で最もよく遭遇する失敗。API が <code>aud</code> に自分の名前を要求し、トークンに無くて 401 になる。原因を特定し、Audience Mapper で直す。API の検査はここではシェルで再現する (第8章で自作 API に同じ検査を足す)。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。</p>
<div class="step">
<h4>手順 1　bob で現状を検査する</h4>
<p>bob は <code>api-service</code> のロールを持たないので <code>aud</code> は <code>account</code> のみ。</p>
<pre>check_aud() { jwt "$1" | jq -c --arg a api-service '{aud, ok: ((.aud | tostring) | contains($a))}'; }
BT=$(get_token bob | jq -r .access_token)
check_aud $BT</pre>
<div class="check"><b>確認</b>
<pre class="out">{"aud":"account","ok":false}</pre></div>
<div class="read"><b>読み方</b>
<p><code>ok: false</code> は、トークンの <code>aud</code> に <code>api-service</code> が無いということ。API が aud を検証するなら 401 になる。トークンそのものは有効 (署名・期限は OK)。</p></div>
</div>
<div class="step">
<h4>手順 2　Audience Mapper を足して再検査する</h4>
<p><code>frontend-spa-dedicated</code> の「Mappers」で「Configure a new mapper」→「Audience」を追加する。Name = <code>aud-api-service</code>、Included Client Audience = <code>api-service</code>、「Add to access token」On で「Save」を押し、同じ bob のトークンを取り直して再検査する。</p>
<pre>BT=$(get_token bob | jq -r .access_token)
check_aud $BT</pre>
<div class="check"><b>確認</b>
<pre class="out">{"aud":["api-service","account"],"ok":true}</pre></div>
<div class="read"><b>読み方</b>
<p><code>ok: true</code> なら直った。Audience Mapper は「ロールに関係なく固定で aud に足す」。ロール付与で Audience Resolve に任せても同じ結果になるが、全ユーザーにロールを付ける運用が必要になる。直らないときは、Mapper の「Add to access token」が Off か、<code>frontend-spa-dedicated</code> ではなく別のスコープに作っている。Evaluate で確認する。この Audience Mapper は第8章の自作 API 呼び出しの前提になるので消さない。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l04-p04', title: `Full Scope Allowed: 載せるロールを絞る`,
        html: `<p class="goal">やりたいこと: <b>Full Scope Allowed</b> が On だと、ユーザーが持つ全ロールがトークンに載る (簡単だが権限が広い)。Off にすると許可したロールだけが載る (最小権限)。違いを確かめる。</p>
<div class="step">
<h4>手順 1　現状のロールを確認する</h4>
<pre>jwt $(get_token alice | jq -r .access_token) | jq -c '{realm_access, resource_access}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{"realm_access":{"roles":["default-roles-demo","offline_access","uma_authorization","user","admin"]},"resource_access":{…}}</pre></div>
<div class="read"><b>読み方</b>
<p>On の間は alice が持つロールがすべて載っている。</p></div>
</div>
<div class="step">
<h4>手順 2　Full scope allowed を Off にする</h4>
<p><code>frontend-spa</code> →「Client scopes」→ <code>frontend-spa-dedicated</code> →「Scope」タブで「Full scope allowed」を Off にし、取り直して同じコマンドを実行する。</p>
<div class="check"><b>確認</b>
<pre class="out">{"realm_access":null,"resource_access":null}</pre></div>
<div class="read"><b>読み方</b>
<p>ロールが消えたなら、許可がない限りトークンにロールが載らない状態になっている。Off にして API が 403 になるときは、API が必要とするロールが許可リストに無いので Scope タブで追加する。</p></div>
</div>
<div class="step">
<h4>手順 3　user だけ許可する</h4>
<p>同じ「Scope」タブの「Assign role」で Realm Role <code>user</code> だけを許可し、再び確認する。確認が終わったら「Full scope allowed」を On に戻す。</p>
<div class="check"><b>確認</b>
<pre class="out">{"realm_access":{"roles":["user"]},"resource_access":null}</pre></div>
<div class="read"><b>読み方</b>
<p><code>user</code> だけ載るなら、アプリごとに必要最小限のロールだけをトークンに載せられる。戻し忘れると第6章以降で <code>admin</code> が見えなくなり、自作 API の <code>/admin</code> が 403 になる (第8章)。必ず On に戻す。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c04-l04-p05', title: `Lightweight Access Token: トークンを小さくして詳細は後から取る`,
        html: `<p class="goal">やりたいこと: claim が増えるとトークンが大きくなる。Lightweight Access Token は Access Token を小さくし、詳細は userinfo / introspection で取る方式。サイズがどれだけ変わるかを測る。</p>
<div class="step">
<h4>手順 1　通常のサイズを測る</h4>
<pre>AT=$(get_token alice | jq -r .access_token); echo -n $AT | wc -c</pre>
<div class="check"><b>確認</b>
<pre class="out">1585          (通常。Mapper の数などで変わる)</pre></div>
<div class="read"><b>読み方</b>
<p>これが比較の基準になる。</p></div>
</div>
<div class="step">
<h4>手順 2　Lightweight にして claim とサイズを見る</h4>
<p><code>frontend-spa</code> の「Advanced」タブを開き、Advanced settings セクションの lightweight access token に関する設定 (Always use lightweight access token) を On にして「Save」を押し、取り直す。</p>
<pre>AT=$(get_token alice | jq -r .access_token); echo -n $AT | wc -c
jwt $AT | jq 'keys'</pre>
<div class="check"><b>確認</b>
<pre class="out">794           (lightweight。数値は目安)
["azp","exp","iat","iss","jti","scope","sid","typ"]   ← claim が減る (aud / sub / realm_access なども消える)</pre></div>
<div class="read"><b>読み方</b>
<p>バイト数と claim 数が減れば、必要最小限の claim だけを載せ、残りを userinfo / introspection に回す方式になっている。API が <code>resource_access</code> を読んでいて落ちるなら、Lightweight で消えた claim が原因なので、API 側も introspection / userinfo を使う設計にする (戻して続行する)。設定項目名はバージョンで差がありうるので、Advanced タブ内で「lightweight」を含む項目を探す。</p></div>
</div>
<div class="step">
<h4>手順 3　詳細を userinfo から取る</h4>
<pre>curl -s -H "Authorization: Bearer $AT" $OIDC/userinfo | jq 'keys'</pre>
<div class="check"><b>確認</b>
<pre class="out">["email","email_verified","family_name","given_name","name","preferred_username","sub","tenant"]</pre></div>
<div class="read"><b>読み方</b>
<p>トークンから消えた詳細が userinfo で取れている。</p></div>
</div>
<div class="step">
<h4>手順 4　Mapper 単位で載せる claim を選ぶ</h4>
<p><code>tenant-hardcoded</code> の「Add to lightweight access token」を On/Off して、トークンを取り直す。確認後、Lightweight の設定を Off に戻す。</p>
<div class="check"><b>確認</b>
<pre class="out">jwt $AT | jq 'keys' に tenant が出る (Mapper が On のとき)。</pre></div>
<div class="read"><b>読み方</b>
<p>「Add to lightweight access token」を On にした Mapper の claim だけが残る。載せる claim は Mapper 単位で選べる。</p></div>
</div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
// 第5章 ハンズオン形式
DATA.chapters.push({
  no: 5, title: `Client 設定`,
  lessons: [
    { id: 'c05-l01', title: `基本項目・Capability config`, pages: [
      { id: 'c05-l01-p01', title: `Client ID と UUID: 画面の名前と内部 ID の違いを API で確かめる`,
        html: `<p class="goal">やりたいこと: Client には人が決める名前 <b>Client ID</b> (例 <code>frontend-spa</code>) と、Keycloak 内部の UUID の2つがある。トークンの <code>azp</code> / <code>aud</code> に出るのは Client ID、Admin REST API の URL に出るのは UUID。両者の対応を確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　Admin REST API で id と clientId を見比べる</h4>
<p>管理者トークンを取り、Admin REST API で Client を検索する。</p>
<pre>ADM=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=admin -d password=admin | jq -r .access_token)
curl -s -H "Authorization: Bearer $ADM" "http://localhost:8080/admin/realms/demo/clients?clientId=frontend-spa" | jq '.[0] | {id, clientId, publicClient, standardFlowEnabled, directAccessGrantsEnabled}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{
  "id": "6b0f…-…-…",
  "clientId": "frontend-spa",
  "publicClient": true,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": true
}</pre></div>
<div class="read"><b>読み方</b>
<p><code>id</code> と <code>clientId</code> を見る。管理コンソールで「Clients」→ <code>frontend-spa</code> を開いたときのアドレスバー (<code>.../#/demo/clients/UUID/settings</code>) の UUID とも一致する。</p><p><code>id</code> (UUID) と <code>clientId</code> が別の値。Admin REST API の <code>/clients/{id}</code> には UUID を、認可リクエストの <code>client_id=</code> やトークンの <code>azp</code> には Client ID を使う。混ぜると 404 になる。</p><ul><li>API が 401: 管理者トークンの期限切れ (master の既定は短い)。もう一度 <code>ADM</code> を取る。</li></ul></div>
</div>
<div class="step">
<h4>手順 2　Name を変えても azp が変わらないことを見る</h4>
<p>「Settings」の General settings で Name を適当に書き換えて「Save」し、トークンを取る。</p>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '{azp}'</pre>
<div class="check"><b>確認</b>
<pre class="out">{ "azp": "frontend-spa" }</pre></div>
<div class="read"><b>読み方</b>
<p>Name / Description は画面表示用で動作に影響しない。一方、Client ID を後から変えると、アプリ側の <code>client_id</code> 設定とトークンの <code>azp</code> / <code>aud</code> がすべて変わるので、作成後は変えない前提で決める。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l01-p02', title: `Standard flow と Direct access grants: 許可していないフローは使えない`,
        html: `<p class="goal">やりたいこと: Capability config の Authentication flow チェックは「このクライアントがどの方法でトークンを取れるか」の許可リスト。使うものだけ On にする原則を、Direct access grants を Off にして確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み (Direct access grants On)。</p>
<div class="step">
<h4>手順 1　現状で Password Grant が通ることを確かめる</h4>
<p>「Clients」→ <code>frontend-spa</code> →「Settings」の Capability config でチェックされているものを読み、次を実行する。</p>
<pre>get_token alice | jq 'has("access_token")'</pre>
<div class="check"><b>確認</b>
<pre class="out">true</pre></div>
<div class="read"><b>読み方</b>
<p><code>true</code> なら Password Grant が許可されている。Direct access grants は Password Grant で、アプリが ID/パスワードを直接受け取る非推奨のフロー (第9章)。この lab では観察のために On にしている。</p></div>
</div>
<div class="step">
<h4>手順 2　Direct access grants を Off にして取り直す</h4>
<p>「Direct access grants」のチェックを外して「Save」を押し、もう一度取る。確認後、チェックを入れ直して「Save」を押す。</p>
<pre>get_token alice | jq</pre>
<div class="check"><b>確認</b>
<pre class="out">{
  "error": "unauthorized_client",
  "error_description": "Client not allowed for direct access grants"
}</pre></div>
<div class="read"><b>読み方</b>
<p><code>unauthorized_client</code> なら、クライアントごとに「許可していないフロー」は token endpoint で拒否される。攻撃面を減らすため、使うフローだけを On にする。</p><ul><li><code>invalid_grant: Invalid user credentials</code>: フローは許可されているが、ユーザー名/パスワードが違う (別の原因)。</li><li>Standard flow を Off にするとブラウザのログイン (authorization endpoint) が拒否される。次ページで確認する。</li></ul></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l01-p03', title: `Standard flow Off / Implicit flow On: ブラウザのログインの許可を確かめる`,
        html: `<p class="goal">やりたいこと: Standard flow は Authorization Code Flow (通常のログイン)、Implicit flow はブラウザにトークンを直接返す古い方式 (非推奨)。許可を切り替えて、authorization endpoint の反応が変わるのを見る。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　Implicit (response_type=token) を試す</h4>
<p>Implicit は Off のはずなので、そのまま認可リクエストを開く。</p>
<pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=token&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid"</pre>
<div class="check"><b>確認</b>
<pre class="out">http://localhost:3000/manual#error=unauthorized_client&amp;error_description=Client+is+not+allowed+to+initiate+browser+login+with+given+response_type.+Implicit+flow+is+disabled+for+the+client.&amp;iss=...</pre></div>
<div class="read"><b>読み方</b>
<p>ログイン画面は出ず、redirect_uri (http://localhost:3000/manual) にエラー付きで戻される。そこは何も動いていないので「接続できません」の画面になるが、アドレスバーを読む (# 以降に付く)。</p><p><code>#error=unauthorized_client</code> なら、Implicit は許可していないので使えない。Implicit を On にすると URL の <code>#</code> 以降に Access Token が丸見えになる (<code>http://localhost:3000/manual#access_token=eyJ…&amp;token_type=Bearer&amp;…</code>) ため、廃止方向の方式で使わない。任意で On にして確かめたら、必ず Off に戻す。</p></div>
</div>
<div class="step">
<h4>手順 2　Standard flow を Off にして通常のログインを試す</h4>
<p>「Standard flow」のチェックを外して「Save」し、通常の <code>response_type=code</code> を開く。確認後、「Standard flow」を入れ直して「Save」を押す。</p>
<pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid"</pre>
<div class="check"><b>確認</b>
<pre class="out">http://localhost:3000/manual?error=unauthorized_client&amp;error_description=Client+is+not+allowed+to+initiate+browser+login+with+given+response_type.+Standard+flow+is+disabled+for+the+client.&amp;iss=...</pre></div>
<div class="read"><b>読み方</b>
<p><code>?error=unauthorized_client</code> で戻るなら、通常ログインが始まらない状態。ブラウザでログインさせたいクライアントでは Standard flow が必須。戻し忘れると第7・8章の SPA でのログインが失敗するので、Standard flow が On か確認してから進む。Service accounts roles / Device Authorization Grant は別のチェックで、それぞれ第9章で確かめる。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l01-p04', title: `PKCE Method を S256 に固定して、PKCE なしのリクエストを拒否させる`,
        html: `<p class="goal">やりたいこと: Public client は secret を持てないので、code の横取りを PKCE で防ぐ。Client 側で PKCE Method を <code>S256</code> に設定すると、<code>code_challenge</code> の無い認可リクエストを Keycloak が<b>拒否</b>する。これを強制しておく。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　設定前に PKCE なしでログイン画面が出ることを見る</h4>
<pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;prompt=login"</pre>
<p><code>prompt=login</code> は、すでに SSO セッションが残っていても必ずログイン画面を出す指定。付けないと、前の章でログインしたままの場合は画面が出ずにそのまま戻される。</p>
<div class="check"><b>確認</b>
<pre class="out">ログイン画面が出る。</pre></div>
<div class="read"><b>読み方</b>
<p>出れば、この時点では PKCE が強制されていない。</p></div>
</div>
<div class="step">
<h4>手順 2　S256 を強制して PKCE なしを開く</h4>
<p><code>frontend-spa</code> →「Advanced」タブ → Advanced settings の「Proof Key for Code Exchange Code Challenge Method」を <code>S256</code> にして「Save」を押し、同じ URL をもう一度開く。</p>
<div class="check"><b>確認</b>
<pre class="out">http://localhost:3000/manual?error=invalid_request&amp;error_description=Missing+parameter%3A+code_challenge_method&amp;iss=...</pre></div>
<div class="read"><b>読み方</b>
<p>エラー画面ではなく redirect_uri にエラー付きで戻される (そこは何も動いていないので「接続できません」になるが、アドレスバーを読む)。</p><p><code>error=invalid_request</code> (Missing parameter: code_challenge_method) で戻されるなら、<code>S256</code> 固定により PKCE を付けないアプリは動かなくなった。強制することで付け忘れを防ぐ。Password Grant (<code>get_token</code>) は影響を受けない (PKCE は Authorization Code Flow の設定)。</p></div>
</div>
<div class="step">
<h4>手順 3　PKCE 付きのリクエストを開く</h4>
<p>固定の例の challenge を付けた URL を開く。</p>
<pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&amp;code_challenge_method=S256&amp;prompt=login"</pre>
<div class="check"><b>確認</b>
<pre class="out">通常のログイン画面が出る。</pre></div>
<div class="read"><b>読み方</b>
<p>PKCE 付きなら通る。次章以降の手動フローは必ず <code>code_challenge</code> (S256) を付ける (第7章の SPA は自動で付ける)。以降、<code>frontend-spa</code> の PKCE は S256 のままにする。</p></div>
</div>`,
        oxIds: [] },
    ] },
    { id: 'c05-l02', title: `Access・Login・Logout settings`, pages: [
      { id: 'c05-l02-p01', title: `Valid redirect URIs: 登録していない戻り先には code を返さない`,
        html: `<p class="goal">やりたいこと: <b>Valid redirect URIs</b> は「ログイン成功後に code を持たせて戻してよい URL」の許可リスト。攻撃者の URL に code を送らせない最重要の設定を、登録外の URL で試して確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> の Valid redirect URIs が <code>http://localhost:3000/*</code>、PKCE S256 設定済み。</p>
<div class="step">
<h4>手順 1　登録済みの範囲内の URL を開く</h4>
<pre>CH=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/anything&amp;scope=openid&amp;code_challenge=$CH&amp;code_challenge_method=S256&amp;prompt=login"</pre>
<div class="check"><b>確認</b>
<pre class="out">ログイン画面が出る。</pre></div>
<div class="read"><b>読み方</b>
<p>登録範囲内なら通る。</p></div>
</div>
<div class="step">
<h4>手順 2　登録外のホストとポートを開く</h4>
<pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://evil.example/cb&amp;scope=openid&amp;code_challenge=$CH&amp;code_challenge_method=S256"
open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:9999/cb&amp;scope=openid&amp;code_challenge=$CH&amp;code_challenge_method=S256"</pre>
<div class="check"><b>確認</b>
<pre class="out">We are sorry...
Invalid parameter: redirect_uri</pre></div>
<div class="read"><b>読み方</b>
<p>どちらもログイン画面の代わりに次のエラー画面が出る。</p><p>登録外の URL が <code>Invalid parameter: redirect_uri</code> になるなら、code は登録した場所にしか送られない。攻撃者のサイトに code を渡す経路を塞げている。同じホストでもポートが違えば拒否される。</p><ul><li>登録したのに拒否される: 末尾スラッシュ、ポート、http/https の違い。コピペで確認する。</li></ul></div>
</div>
<div class="step">
<h4>手順 3　ワイルドカードなしに変えて試す</h4>
<p>Valid redirect URIs を <code>http://localhost:3000/callback</code> (ワイルドカードなし) に変更して「Save」し、手順1の URL をもう一度開く。確認後 <code>http://localhost:3000/*</code> に戻す。</p>
<div class="check"><b>確認</b>
<pre class="out">同じエラー画面 (Invalid parameter: redirect_uri) が出る。</pre></div>
<div class="read"><b>読み方</b>
<p><code>/anything</code> が拒否されるなら、書き方は完全一致か末尾 <code>*</code>。本番で <code>*</code> だけの登録は、どの URL にも code を返してしまうので危険。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l02-p02', title: `Web origins: ブラウザの CORS を許可する`,
        html: `<p class="goal">やりたいこと: SPA が token endpoint を JavaScript で呼ぶには、ブラウザの CORS 許可が要る。<b>Web origins</b> に登録した送信元だけが許可される。許可/不許可で応答ヘッダがどう変わるかを curl で確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> の Web origins が <code>http://localhost:3000</code>。</p>
<div class="step">
<h4>手順 1　許可された Origin で CORS ヘッダを見る</h4>
<pre>curl -si -X POST $OIDC/token -H 'Origin: http://localhost:3000' -d grant_type=password -d client_id=frontend-spa -d username=alice -d password=alice | grep -i '^access-control'</pre>
<div class="check"><b>確認</b>
<pre class="out">Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Expose-Headers: Access-Control-Allow-Methods
Access-Control-Allow-Credentials: true</pre></div>
<div class="read"><b>読み方</b>
<p><code>Access-Control-Allow-Origin</code> が付けば、ブラウザの JS が応答を読める (ヘッダ名の大文字小文字は環境で変わる)。</p></div>
</div>
<div class="step">
<h4>手順 2　登録外の Origin で比べる</h4>
<pre>curl -si -X POST $OIDC/token -H 'Origin: http://evil.example' -d grant_type=password -d client_id=frontend-spa -d username=alice -d password=alice | grep -i '^access-control'</pre>
<div class="check"><b>確認</b>
<pre class="out">何も出ない。</pre></div>
<div class="read"><b>読み方</b>
<p>登録外だとヘッダが付かず、ブラウザはレスポンスをブロックする (自作 SPA で出る CORS エラー)。第7章の SPA で token リクエストが CORS エラーになるなら、<code>frontend-spa</code> の Web origins に <code>http://localhost:3000</code> が無い。</p></div>
</div>
<div class="step">
<h4>手順 3　allowed-origins claim を見る</h4>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '."allowed-origins"'</pre>
<div class="check"><b>確認</b>
<pre class="out">[ "http://localhost:3000" ]</pre></div>
<div class="read"><b>読み方</b>
<p>Web origins の値がそのまま claim になる (<code>web-origins</code> スコープの仕事)。Web origins を <code>+</code> に変えて確かめてもよい (Valid redirect URIs の origin を自動で許可する意味で、いまは origin が同じなので結果も同じ)。確認後 <code>http://localhost:3000</code> に戻す。<code>*</code> は全許可で非推奨。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l02-p03', title: `Consent required: ログイン時の同意画面`,
        html: `<p class="goal">やりたいこと: <b>Consent required</b> を On にすると、ログイン時に「このアプリに情報を渡してよいか」の同意画面が出る。Login settings の効果を目で確かめ、Logout settings の置き場所も確認する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>frontend-spa</code> 作成済み。</p>
<div class="step">
<h4>手順 1　Consent required を On にして同意画面を出す</h4>
<p><code>frontend-spa</code> →「Settings」→ Login settings の「Consent required」を On にして「Save」を押し、シークレットウィンドウで認可 URL を開き、<code>alice</code> でログインして「Yes」を押す。</p>
<pre>CH=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid%20email%20profile&amp;code_challenge=$CH&amp;code_challenge_method=S256"</pre>
<div class="check"><b>確認</b>
<pre class="out">Grant Access to frontend-spa
Do you grant these access privileges?
  Email address
  User profile
  User roles
  [Yes] [No]</pre></div>
<div class="read"><b>読み方</b>
<p>同意画面の項目を読む (項目は付いているスコープで変わる)。</p><p>同意画面が出れば、ユーザーがアプリへの情報提供に同意する仕組みが有効になっている。外部の第三者アプリ向けの設定で、自社アプリでは通常 Off。出ないときは、すでに同意済みか、シークレットウィンドウではなく SSO セッションが残っている。</p></div>
</div>
<div class="step">
<h4>手順 2　同意の記録を見る</h4>
<p>管理コンソール「Users」→ <code>alice</code> →「Consents」タブを開く。</p>
<div class="check"><b>確認</b>
<pre class="out">frontend-spa が1行できている。</pre></div>
<div class="read"><b>読み方</b>
<p>同意は記録され、取り消すまで次回以降は聞かれない。再試行したいときは Consents の行を削除する。</p></div>
</div>
<div class="step">
<h4>手順 3　Logout settings の場所を確認して戻す</h4>
<p>「Settings」の Logout settings (Front channel logout / Backchannel logout URL / Backchannel logout session required) の場所を確認する (使い方は第9章)。確認後、Consent required を Off に戻す。</p>
<div class="check"><b>確認</b>
<pre class="out">Logout settings の項目が見える。</pre></div>
<div class="read"><b>読み方</b>
<p>戻し忘れると第7章の SPA ログインで毎回同意画面が出る。</p></div>
</div>`,
        oxIds: [] },
    ] },
    { id: 'c05-l03', title: `Credentials・各タブ・Token 寿命`, pages: [
      { id: 'c05-l03-p01', title: `Credentials タブ: secret の再生成で古い secret が即無効になる`,
        html: `<p class="goal">やりたいこと: Client authentication が On のクライアントには <b>Credentials</b> タブがあり、Client Authenticator と Client secret を設定する。secret を再生成すると古い secret はすぐ使えなくなる。これを <code>api-service</code> で確かめる。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>api-service</code> が Confidential で作成済み (secret は <code>$API_SECRET</code>)。</p>
<div class="step">
<h4>手順 1　今の secret で introspection を通す</h4>
<p><code>api-service</code> →「Credentials」タブを開き、Client Authenticator の選択肢を読む (Client Id and Secret / Signed Jwt / Signed Jwt with Client Secret / X509 Certificate)。そのうえで次を実行する。</p>
<pre>AT=$(get_token alice | jq -r .access_token)
curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq .active</pre>
<div class="check"><b>確認</b>
<pre class="out">true</pre></div>
<div class="read"><b>読み方</b>
<p><code>true</code> なら今の secret が有効。「Client Id and Secret」は共通の合言葉を送る一番簡単な方式 (Basic ヘッダまたは body)。Signed Jwt は secret を通信に乗せない方式で、金融系などで使う。</p></div>
</div>
<div class="step">
<h4>手順 2　Regenerate して古い secret を試す</h4>
<p>「Regenerate」を押して確認ダイアログで承認し、新しい secret を控える。古い secret のまま手順1の introspection をもう一度実行する。</p>
<div class="check"><b>確認</b>
<pre class="out">{ "error": "invalid_request", "error_description": "Authentication failed." }</pre></div>
<div class="read"><b>読み方</b>
<p>古い secret でエラーなら、Regenerate した瞬間に旧 secret は無効になる。secret を使っているアプリ側の設定を同時に更新しないと止まる。無停止で入れ替えたいときは Client secret rotation 機能 (Advanced タブ) を使う。</p></div>
</div>
<div class="step">
<h4>手順 3　新しい secret に差し替える</h4>
<p>新しい secret を <code>~/develop/kc-handson/kc-lab.sh</code> の <code>API_SECRET</code> に反映し、<code>source</code> し直して手順1を再実行する。</p>
<div class="check"><b>確認</b>
<pre class="out">true</pre></div>
<div class="read"><b>読み方</b>
<p>新しい secret で <code>true</code> に戻れば、失敗の原因は設定のズレだったと分かる。Credentials タブ自体が無いなら Client authentication が Off (次ページ)。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l03-p02', title: `各タブの出方: Credentials / Service accounts roles / Roles`,
        html: `<p class="goal">やりたいこと: Clients の各タブ (Settings / Roles / Client scopes / Credentials / Service accounts roles / Advanced ...) は設定によって出たり消えたりする。どの設定がどのタブを出すかを、スイッチを切り替えて確認する。</p>
<div class="step">
<h4>手順 1　Client authentication を切り替える</h4>
<p><code>api-service</code> を開いて上部のタブ一覧を書き留め、「Settings」の Capability config で「Client authentication」を Off にして「Save」を押す。確認後 On に戻す (secret が再生成されるので Credentials で確認する)。</p>
<div class="check"><b>確認</b>
<pre class="out">操作  |  タブの変化
Client authentication On  |  Credentials タブが出る
Client authentication Off  |  Credentials タブが消える</pre></div>
<div class="read"><b>読み方</b>
<p>Credentials は Client authentication On のときだけ出る。secret を持てる (Confidential) クライアントだけの機能。切り替えると secret が変わるので、<code>$API_SECRET</code> を更新すること。</p></div>
</div>
<div class="step">
<h4>手順 2　Service accounts roles を切り替える</h4>
<p>「Service accounts roles」にチェックして「Save」を押し、タブの変化を見る。確認後、チェックを外して「Save」を押す。</p>
<div class="check"><b>確認</b>
<pre class="out">操作  |  タブの変化
Service accounts roles On  |  Service accounts roles タブが出る
(常に)  |  Roles (Client Role の作成)、Client scopes、Advanced、Sessions</pre></div>
<div class="read"><b>読み方</b>
<p>Service accounts roles タブは Client Credentials 用 (第9章) で、ユーザー不在のトークンに付くロールを設定する場所。Roles タブはそのクライアント専用の Client Role を作る場所 (第4章で <code>api-service</code> に <code>read</code> を作った)。</p></div>
</div>
<div class="step">
<h4>手順 3　Evaluate で発行結果を見る</h4>
<p><code>frontend-spa</code> を開き、Client scopes タブの「Evaluate」サブタブで Users = <code>alice</code> を選ぶ。</p>
<div class="check"><b>確認</b>
<pre class="out">「Generated access token」にトークンの claim が表示される。</pre></div>
<div class="read"><b>読み方</b>
<p>Evaluate で見たトークンは実際の発行結果と同じ。claim の調査の最初の一手になる。</p></div>
</div>`,
        oxIds: [] },
      { id: 'c05-l03-p03', title: `Token 寿命: Realm 設定と Client ごとの上書き`,
        html: `<p class="goal">やりたいこと: Access Token の寿命 (既定 5 分) は Realm settings で決まり、Client の Advanced タブで上書きできる。実際に寿命を短くして <code>exp</code> と API の応答の変化を確かめ、Session 系の期限の置き場所も把握する。前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み、<code>api-service</code> と <code>$API_SECRET</code> が用意済み。</p>
<div class="step">
<h4>手順 1　現状の寿命を確認する</h4>
<pre>jwt $(get_token alice | jq -r .access_token) | jq '.exp - .iat'</pre>
<div class="check"><b>確認</b>
<pre class="out">300</pre></div>
<div class="read"><b>読み方</b>
<p>300 秒 (5 分) が既定の寿命。</p></div>
</div>
<div class="step">
<h4>手順 2　Realm の寿命を 1 分にして、期限切れを確かめる</h4>
<p>「Realm settings」→「Tokens」タブの「Access Token Lifespan」を <code>1 Minutes</code> にして「Save」を押し、次を実行する。</p>
<pre>T=$(get_token alice); echo $T | jq '.expires_in'
AT=$(echo $T | jq -r .access_token)
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $AT" $OIDC/userinfo
sleep 65
curl -si -H "Authorization: Bearer $AT" $OIDC/userinfo | grep -iE '^(HTTP|www-authenticate)'</pre>
<div class="check"><b>確認</b>
<pre class="out">60
200
(65秒後) HTTP/1.1 401 ... WWW-Authenticate: Bearer realm="demo", error="invalid_token", error_description="Token verification failed" (期限切れ。本文は空)</pre></div>
<div class="read"><b>読み方</b>
<p><code>expires_in</code>、直後の HTTP ステータス、65 秒後の応答を見る。</p><p><code>expires_in</code> が 60 なら Realm の設定が反映された。短いほど漏洩に強いが、更新 (Refresh) の頻度が上がる。65 秒後に 401 と <code>invalid_token</code> が返れば、期限切れの Access Token は Keycloak もリソース側も拒否する。Refresh Token で取り直す (第9章)。</p></div>
</div>
<div class="step">
<h4>手順 3　Client の Advanced で上書きする</h4>
<p><code>frontend-spa</code> →「Advanced」タブの Advanced settings の「Access Token Lifespan」を <code>10 Minutes</code> にして「Save」し、取り直して <code>expires_in</code> を確認する。</p>
<pre>get_token alice | jq '.expires_in'</pre>
<div class="check"><b>確認</b>
<pre class="out">(Client 上書き後) 600</pre></div>
<div class="read"><b>読み方</b>
<p>Client ごとの設定が Realm の設定を上書きする。</p></div>
</div>
<div class="step">
<h4>手順 4　Session 系の期限を読んで元に戻す</h4>
<p>「Realm settings」→「Sessions」タブの SSO Session Idle / SSO Session Max を読む。確認後、Client の上書きを空に戻し、Realm の Access Token Lifespan を <code>5 Minutes</code> に戻す。</p>
<div class="check"><b>確認</b>
<pre class="out">SSO Session Idle (既定 30 分) / SSO Session Max (既定 10 時間) の値が出る。</pre></div>
<div class="read"><b>読み方</b>
<p>これはログイン状態 (Session) の期限で、Refresh Token が使える期間に影響する。Access Token の寿命とは別物。戻し忘れると以降の待ち時間の記述とズレる。</p></div>
</div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
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
// 第7章 ハンズオン形式
DATA.chapters.push({
  no: 7, title: `フローの前提: アプリ種別・state・nonce・PKCE`,
  lessons: [
    { id: 'c07-l01', title: `3つのアプリ(SPA・Web・API)の違い`, pages: [
      { id: 'c07-l01-p01', title: `SPA (Public client) を自作してログインする`,
        html: `<p class="goal">やりたいこと: <code>frontend-spa</code> に対応する、ブラウザだけで動く最小の SPA を書き、Authorization Code Flow + PKCE でログインして ID トークンと Access Token を表示する。以降のページはこのファイルを少しずつ拡張する。</p><div class="step"><h4>手順 1　SPA を作って配信する</h4><p>前提: <code>frontend-spa</code> が Public (Client authentication Off)・Standard flow On・Valid redirect URIs = <code>http://localhost:3000/*</code>・Web origins = <code>http://localhost:3000</code>・PKCE S256 で作成済み (第2・5章)。<code>~/develop/kc-handson/spa/</code> がある。</p><p><code>~/develop/kc-handson/spa/index.html</code> を次の内容で作る。</p><pre>&lt;!doctype html&gt;
&lt;meta charset="utf-8"&gt;
&lt;title&gt;frontend-spa&lt;/title&gt;
&lt;button id="login"&gt;login&lt;/button&gt;
&lt;pre id="out"&gt;&lt;/pre&gt;
&lt;script&gt;
const ISS = 'http://localhost:8080/realms/demo';   // issuer
const CLIENT = 'frontend-spa';                     // Public client: secret は持たない
const REDIRECT = 'http://localhost:3000/';         // Valid redirect URIs に含まれる URL
const out = document.getElementById('out');
const log = (title, obj) =&gt; { out.textContent += '## ' + title + '\\n' + JSON.stringify(obj, null, 2) + '\\n\\n'; };
const b64u = (bytes) =&gt; btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
const rand = (n) =&gt; b64u(crypto.getRandomValues(new Uint8Array(n)));
const decode = (jwt) =&gt; JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); // payload を読むだけ

document.getElementById('login').onclick = async () =&gt; {
  const state = rand(16), nonce = rand(16), verifier = rand(48);   // ログインごとの使い捨て値
  const challenge = b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))); // PKCE: S256
  sessionStorage.setItem('login', JSON.stringify({ state, nonce, verifier })); // 戻ってきたときの照合用
  const params = new URLSearchParams({ client_id: CLIENT, response_type: 'code', redirect_uri: REDIRECT,
    scope: 'openid', state, nonce, code_challenge: challenge, code_challenge_method: 'S256' });
  location.href = ISS + '/protocol/openid-connect/auth?' + params;  // ブラウザを Keycloak へ
};

(async () =&gt; {                                      // Keycloak から戻ってきたとき
  const q = new URLSearchParams(location.search);
  if (!q.has('code')) return;
  log('1. callback', Object.fromEntries(q));
  const saved = JSON.parse(sessionStorage.getItem('login') || '{}');
  sessionStorage.removeItem('login');                // 使い捨て
  if (q.get('state') !== saved.state) return log('STATE MISMATCH -&gt; 中止', { got: q.get('state'), saved: saved.state });
  const res = await fetch(ISS + '/protocol/openid-connect/token', { method: 'POST', body: new URLSearchParams({
    grant_type: 'authorization_code', client_id: CLIENT, code: q.get('code'),
    redirect_uri: REDIRECT, code_verifier: saved.verifier }) });  // secret の代わりに code_verifier
  const tok = await res.json();
  if (!res.ok) return log('token error ' + res.status, tok);
  log('2. token response (keys)', Object.keys(tok));
  const id = decode(tok.id_token);
  log('3. id_token', id);
  if (id.nonce !== saved.nonce) return log('NONCE MISMATCH -&gt; 中止', { got: id.nonce, saved: saved.nonce });
  log('4. access_token', decode(tok.access_token));
  window.tokens = tok;                               // Console から tokens.access_token で使える
  history.replaceState(null, '', '/');               // URL から code を消す
})();
&lt;/script&gt;</pre><p>別のターミナルでファイルを配信する。</p><pre>cd ~/develop/kc-handson/spa
python3 -m http.server 3000</pre><div class="check"><b>確認</b><pre class="out">ブラウザで http://localhost:3000/ を開き、「login」ボタンが出る。</pre></div><div class="read"><b>読み方</b><p>ボタンが出れば配信できている。出ないなら <code>http.server</code> を起動したディレクトリが違う。</p></div></div><div class="step"><h4>手順 2　ログインして出力を読む</h4><p>「login」を押し、<code>alice</code> / <code>alice</code> でログインする。</p><div class="check"><b>確認</b><pre class="out">## 1. callback
{ "state": "…", "session_state": "…", "iss": "http://localhost:8080/realms/demo", "code": "…" }
## 2. token response (keys)
[ "access_token", "expires_in", "refresh_expires_in", "refresh_token", "token_type", "id_token", "not-before-policy", "session_state", "scope" ]
## 3. id_token
{ "iss": "…/realms/demo", "aud": "frontend-spa", "azp": "frontend-spa", "nonce": "…", "preferred_username": "alice", … }
## 4. access_token
{ "azp": "frontend-spa", "aud": […], "realm_access": {…}, … }</pre></div><div class="read"><b>読み方</b><p>戻ってきた画面の出力を読む (抜粋)。</p><p>claim が出たなら、Keycloak でログインし、code を token に交換して、ID トークンの nonce も照合できた。ブラウザの JS にトークンが載っている (<code>tokens</code> を Console で読める) ので、XSS で盗まれるリスクがある。Web アプリ (サーバー保持) との大きな違い。</p><ul><li><code>Invalid parameter: redirect_uri</code> → Valid redirect URIs が <code>http://localhost:3000/*</code> でない。</li><li>token リクエストが CORS エラー → Web origins が <code>http://localhost:3000</code> でない (第5章)。</li><li><code>crypto.subtle</code> が undefined → <code>127.0.0.1</code> など安全でない origin で開いている。必ず <code>http://localhost:3000</code>。</li></ul></div></div><div class="step"><h4>手順 3　token リクエストを見る</h4><p>開発者ツールの Network タブ (「Preserve log」On) で、<code>token</code> リクエストの Payload を開く。</p><div class="check"><b>確認</b><pre class="out">grant_type: authorization_code
client_id: frontend-spa
code: …
redirect_uri: http://localhost:3000/
code_verifier: …          ← client_secret は無い</pre></div><div class="read"><b>読み方</b><p>Payload に <code>client_secret</code> が無く <code>code_verifier</code> がある。</p><p>Public client は secret の代わりに、ログインごとの使い捨ての鍵 (PKCE) で守られる。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l01-p02', title: `同じフローを Web アプリ (Confidential) で行って、SPA と並べる`,
        html: `<p class="goal">やりたいこと: SPA と Web アプリは同じ Authorization Code Flow で、違いは<b>コードがどこで動くか</b>だけ。第6章の Web アプリ (<code>backend-web</code>) と並べて、token リクエスト・トークンの置き場所・Cookie の違いを確認する。</p><div class="step"><h4>手順 1　Web アプリでログインする</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) が <code>:3000</code> で動いている。第6章 l01 p04 の <code>~/develop/kc-handson/web/server.js</code> がある。</p><p>別のターミナルで Web アプリを起動し、ブラウザで <code>http://localhost:3001/</code> から login する。</p><pre>cd ~/develop/kc-handson/web
CLIENT_SECRET=ここにbackend-webのsecret node server.js</pre><div class="check"><b>確認</b><pre class="out">SPA と Web アプリそれぞれの画面の azp / aud を見比べる。</pre></div><div class="read"><b>読み方</b><p><code>azp</code> が <code>frontend-spa</code> と <code>backend-web</code> で異なる。同じユーザーでも、どのクライアントが要求したかがトークンに残る。</p></div></div><div class="step"><h4>手順 2　トークンの置き場所を比べる</h4><p>開発者ツールの Application → Storage で、<code>localhost:3000</code> の Session Storage と <code>localhost:3001</code> の Cookies を見る。Network タブでは <code>localhost:3001</code> のレスポンスに <code>access_token</code> の文字列が含まれるか検索する。</p><div class="check"><b>確認</b><pre class="out">SPA: トークンはブラウザのメモリ (window.tokens)
Web: Cookie sid だけ</pre></div><div class="read"><b>読み方</b><p>token リクエストは、SPA が client_id + code_verifier でブラウザから送り (Network に見える)、Web はサーバーが client_id + secret (Basic) で送る (ターミナルのログにだけ出る)。</p><p>Web アプリのレスポンスにトークン文字列が無ければ、トークンはサーバー内に留まりブラウザには Cookie しか渡っていない。違いは「secret を隠せるか」で、ブラウザに配るコードに secret を書いても抜かれるので、SPA は secret なし + PKCE。検索で見つかった場合は、表示用に claim をデコードしているだけか (署名付き文字列そのものが出ていないか) を確かめる。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l01-p03', title: `azp と aud: SPA のトークンは API 向け (Bearer) に使える`,
        html: `<p class="goal">やりたいこと: 3つ目の登場人物 API (Resource Server) は、渡された Access Token を検証するだけでユーザーとは話さない。SPA が取ったトークンの <code>azp</code> (要求者) と <code>aud</code> (宛先) を読み、<code>api-service</code> 宛になっているか確かめる。API 自体は第8章で作る。</p><div class="step"><h4>手順 1　Access Token の宛先を読む</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) で <code>http://localhost:3000/</code> からログイン済み。<code>api-service</code> 宛の Audience Mapper (第4章) 設定済み。SPA の画面で開発者ツールの Console を開く。</p><pre>JSON.parse(atob(tokens.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).aud</pre><div class="check"><b>確認</b><pre class="out">[ "api-service", "account" ]</pre></div><div class="read"><b>読み方</b><p>Console に <code>aud</code> が出る。</p><p><code>aud</code> に <code>api-service</code> が入っていれば、このトークンは API 向けに使える。無ければ <code>frontend-spa</code> の Audience Mapper (Included Client Audience = <code>api-service</code>、Add to access token On) を確認する。</p></div></div><div class="step"><h4>手順 2　Access Token と ID トークンを Bearer にして userinfo を呼ぶ</h4><p>Access Token を Bearer にして Keycloak の userinfo を呼ぶ。</p><pre>fetch('http://localhost:8080/realms/demo/protocol/openid-connect/userinfo', { headers: { Authorization: 'Bearer ' + tokens.access_token } }).then(r =&gt; r.json()).then(console.log)</pre><p>ID トークンを Bearer にして同じ userinfo を呼ぶ。</p><pre>fetch('http://localhost:8080/realms/demo/protocol/openid-connect/userinfo', { headers: { Authorization: 'Bearer ' + tokens.id_token } }).then(r =&gt; r.status).then(console.log)</pre><div class="check"><b>確認</b><pre class="out">{ sub: "…", email_verified: true, name: "Alice Example", preferred_username: "alice", email: "alice@example.com" }
401</pre></div><div class="read"><b>読み方</b><p>1つ目はトークンの持ち主の情報、2つ目はステータスが出る。</p><p>Access Token は通り、ID トークンは 401。Bearer に付けて送るのは Access Token で、ID トークンはクライアント自身が読むための書類。SPA / Web = ログインさせる側 (トークンを取る)、API = トークンを受け取って検証する側 (ログイン画面は出さない)。API を Keycloak に登録するのは、<code>aud</code> の宛先としての名前、Client Role の置き場所、introspection の認証 (Confidential) のため。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c07-l02', title: `用語整理と state`, pages: [
      { id: 'c07-l02-p01', title: `認可リクエストの URL を分解して、各パラメータの意味を確かめる`,
        html: `<p class="goal">やりたいこと: フローに出てくる用語 (<code>redirect_uri</code> / <code>scope</code> / <code>state</code> / <code>nonce</code> / <code>code_challenge</code> / <code>code</code>) を、実際の通信から1つずつ拾って覚える。</p><div class="step"><h4>手順 1　auth リクエストを読む</h4><p>SPA (<code>http://localhost:3000/</code>) を開き、開発者ツールの Network タブで「Preserve log」を On にして「login」を押し、ログインする。一覧の <code>auth?client_id=frontend-spa...</code> を選び、Query String Parameters を読む。</p><div class="check"><b>確認</b><pre class="out">client_id, response_type=code, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method が並ぶ</pre></div><div class="read"><b>読み方</b><ul><li><code>client_id</code>: どのクライアントか (<code>frontend-spa</code>)</li><li><code>response_type=code</code>: Authorization Code Flow を使う</li><li><code>redirect_uri</code>: code を戻す先。token でも同じ値を送る</li><li><code>scope</code>: 欲しい範囲 (<code>openid</code> 必須)</li><li><code>state</code>: 引換番号。そのまま戻ってくる</li><li><code>nonce</code>: ID トークンの使い回し防止。ID トークン内に戻る</li><li><code>code_challenge</code> / <code>_method</code>: PKCE の「錠」(S256 のハッシュ)</li></ul><p>Network に <code>auth</code> が見えないなら「Preserve log」が Off で、ページ遷移時にログが消えた。</p></div></div><div class="step"><h4>手順 2　戻りの URL と token リクエストを読む</h4><p><code>localhost:3000/?...code=...</code> (Keycloak からの 302 の移動先) の URL と、<code>token</code> リクエストの Payload を読む。</p><div class="check"><b>確認</b><pre class="out">戻りの URL に code と state (と iss / session_state) が付き、token の Payload に code と code_verifier がある。</pre></div><div class="read"><b>読み方</b><p>戻りの URL に出るのは引換券 (<code>code</code>、ワンタイム・短命) であってトークンではない。<code>code_challenge</code> は auth の URL に出るが、鍵の <code>code_verifier</code> は token リクエストにしか出ず URL に残らない。<code>redirect_uri</code> は auth と token で同じ値にする (違うと token 交換が <code>invalid_grant</code>)。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l02-p02', title: `code は1回だけ・短時間だけ使える`,
        html: `<p class="goal">やりたいこと: <code>code</code> はトークンそのものではない引換券で、ワンタイム・短命 (約1分)。実際に code を2回使って確かめる。ブラウザの動きを手で再現するので、PKCE の固定値を使う (第5章と同じ組)。</p><div class="step"><h4>手順 1　code を取る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>frontend-spa</code> は PKCE S256 設定済み。</p><p>固定の verifier / challenge を用意する (SHA-256 の関係は l04 で確かめる)。</p><pre>V=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
C=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</pre><p>認可リクエストをブラウザで開き、ログインする。</p><pre>open "$OIDC/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;state=s1&amp;nonce=n1&amp;code_challenge=$C&amp;code_challenge_method=S256"</pre><p>遷移先 (接続エラーや 404 でよい) のアドレスバーから <code>code=</code> の値を取って変数に入れる。</p><pre>CODE=ここにアドレスバーのcode</pre><div class="check"><b>確認</b><pre class="out">アドレスバーに code= が付いている。</pre></div><div class="read"><b>読み方</b><p><code>code=</code> があればログインは成功で、まだ交換していない引換券が手元にある。</p></div></div><div class="step"><h4>手順 2　code を2回交換する</h4><p>1回目。</p><pre>curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$V | jq 'keys'</pre><p>同じ code でもう1回。</p><pre>curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$V | jq</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "id_token", "not-before-policy", "refresh_expires_in", "refresh_token", "scope", "session_state", "token_type" ]
{ "error": "invalid_grant", "error_description": "Code not valid" }</pre></div><div class="read"><b>読み方</b><p>1回目はキーの一覧、2回目はエラーが返る。</p><p>1回目は成功、2回目が <code>invalid_grant</code> なら code は1回限りで、盗まれても使い回せない。ログインから1分以上たって交換しても <code>invalid_grant</code> になる (短命)。code を挟むのは、トークン本体をブラウザの URL (履歴・ログ・Referer) に出さないため。</p><ul><li><code>redirect_uri</code> を認可時と変えて交換するとエラー → 認可時と token 時で同一でなければならない。</li><li>2回目で <code>code_verifier</code> も正しいのに失敗 → code 自体が使用済みだから。使用済みの code を再提示すると、Keycloak は1回目に発行したトークンのセッションも終了させる (1回目の Access Token で userinfo を呼ぶと 401 になる)。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c07-l02-p03', title: `state が「自分が始めたログインの結果か」を確かめている様子を見る`,
        html: `<p class="goal">やりたいこと: state は「いま戻ってきたレスポンスは、自分が出したログインの結果か」を確かめる番号札。SPA のコードのどこで作られ、どこで照合されるかを実際の値で追う。</p><div class="step"><h4>手順 1　保存された state を追う</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) が <code>:3000</code> で動いている。管理コンソールの「Sessions」で「Action」→「Sign out all active sessions」→「Confirm」を押して SSO セッションを空にしてから始める (残っているとログイン画面が出ずに戻る)。</p><p>Console で、「login」を押す前に保存状態を確認する。</p><pre>sessionStorage.getItem('login')</pre><p>「login」を押し、Keycloak のログイン画面が出たところで Network タブの <code>auth?...</code> の <code>state</code> を控える。ログインを完了して戻り、画面の「1. callback」の <code>state</code> と見比べる。</p><div class="check"><b>確認</b><pre class="out">null                              (login を押す前)
(Keycloak に飛んだ後は別 origin なので Console では見えない)
画面: "state": "aB3d…"            ← auth の URL の state と同じ値</pre></div><div class="read"><b>読み方</b><p>auth の <code>state</code> と戻りの <code>state</code> が同じ値になる。</p><p>Keycloak は state を加工せずそのまま返す。照合に使う値はブラウザのセッション (<code>sessionStorage</code>) にだけ保存されていて、他人 (攻撃者) は読めないので、一致する値を用意できない。</p></div></div><div class="step"><h4>手順 2　照合後の状態を見る</h4><p>Console で再度保存状態を確認し、SPA の <code>index.html</code> の <code>sessionStorage.setItem</code> と <code>q.get('state') !== saved.state</code> の行を読む。</p><pre>sessionStorage.getItem('login')</pre><div class="check"><b>確認</b><pre class="out">null                              (照合後に消えている = 使い捨て)</pre></div><div class="read"><b>読み方</b><p><code>null</code> が返る。</p><p>照合後に <code>login</code> が消えるのは使い捨てにして、古い・使い回しのレスポンスを受け付けないため。state は付けるだけでは何も守れず、戻りで照合して初めて意味がある。守る対象は PKCE と違い、state = アプリが戻りレスポンスを照合、PKCE = Keycloak が code を持つ人を照合。両方使う。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l02-p04', title: `state を故意に壊して、他人が作ったログイン完了 URL を拒否させる`,
        html: `<p class="goal">やりたいこと: 攻撃者 Eve が自分のアカウントでログインして得た完了 URL (<code>?code=...&amp;state=...</code>) を被害者に踏ませる (Login CSRF)。state があると被害者のアプリはそれを拒否する。この攻撃を手元で再現し、さらに、わざと state を壊すスイッチを SPA に足す。</p><div class="step"><h4>手順 1　Eve の完了 URL を被害者に踏ませる</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) が動いている。</p><p>Eve の役。通常のウィンドウで、SPA を使わずに認可 URL を直接開き、<code>state=eve-state</code> でログインして、戻り先 URL (<code>http://localhost:3000/?...&amp;state=eve-state&amp;code=...</code>) をアドレスバーからコピーする (Eve のウィンドウの SPA は state が保存値と一致しないため処理を中止し、code は交換されないまま残る)。</p><pre>C=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
open "http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/&amp;scope=openid&amp;state=eve-state&amp;nonce=n1&amp;code_challenge=$C&amp;code_challenge_method=S256"</pre><p>被害者の役。<b>シークレットウィンドウ</b>を開き、コピーした URL をそのまま貼って開く (sessionStorage が空の別ブラウザ状態)。</p><div class="check"><b>確認</b><pre class="out">## 1. callback
{ …, "state": "eve-state", "code": "…" }
## STATE MISMATCH -&gt; 中止
{ "got": "eve-state" }</pre></div><div class="read"><b>読み方</b><p>被害者のウィンドウ (SPA) の画面を読む。</p><p><code>STATE MISMATCH -&gt; 中止</code> が出て token リクエストが行われなければ、他人が作った完了 URL を踏まされても攻撃者のアカウントでログインさせられない。<code>saved</code> の項目が出ないのは (保存値が undefined で JSON から消える)、被害者のブラウザにそのログインの state が保存されていないため。Eve は被害者のセッションの中身を読めず、一致する値を作れない。token まで進んでしまうなら、state を照合していないアプリで Login CSRF に弱い。</p></div></div><div class="step"><h4>手順 2　壊すスイッチを足して state を不一致にする</h4><p>SPA の <code>login</code> ボタンの処理で保存する行を、次の4行に置き換える (わざと壊すスイッチ)。</p><pre>const brk = new URLSearchParams(location.search).get('break');   // 学習用: わざと壊す
sessionStorage.setItem('login', JSON.stringify({ state: brk === 'state' ? 'tampered' : state,
  nonce: brk === 'nonce' ? 'tampered' : nonce,
  verifier: brk === 'verifier' ? rand(48) : verifier }));</pre><p><code>http://localhost:3000/?break=state</code> を開いて「login」を押し、ログインを完了させる。</p><div class="check"><b>確認</b><pre class="out">## STATE MISMATCH -&gt; 中止
{ "got": "aB3d…", "saved": "tampered" }</pre></div><div class="read"><b>読み方</b><p>SPA の画面に不一致が出る。</p><p>保存値と戻り値が違うだけでアプリは処理を打ち切る。正規のログインでも state の照合が正しく動いていることの確認になる。このスイッチは次の nonce / PKCE のページでも使う (<code>break=nonce</code> / <code>break=verifier</code>)。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c07-l03', title: `nonce`, pages: [
      { id: 'c07-l03-p01', title: `nonce は ID トークンの中に署名つきで戻ってくる`,
        html: `<p class="goal">やりたいこと: nonce は「この ID トークンは、今回始めたログインのために作られたものか」を確かめる合言葉。アプリが送った値が ID トークンの <code>nonce</code> claim に戻ること、Access Token には入らないことを確かめる。</p><div class="step"><h4>手順 1　SPA の nonce を見る</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) が動いている。<code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。管理コンソールの「Sessions」で「Action」→「Sign out all active sessions」→「Confirm」を押して SSO セッションを空にしてから始める (残っているとログイン画面が出ずに戻る)。</p><p>SPA で login し、Network タブで auth リクエストの <code>nonce</code> を控える。</p><div class="check"><b>確認</b><pre class="out">画面の「3. id_token」の nonce が控えた値と同じで、「4. access_token」には nonce が無い。</pre></div><div class="read"><b>読み方</b><p>nonce は ID トークンの話で、Access Token には入らない。</p></div></div><div class="step"><h4>手順 2　自分で決めた nonce を送る</h4><p>認可 URL を直接開き、自分で決めた nonce を送る。</p><pre>V=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk; C=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
open "$OIDC/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;nonce=my-nonce-123&amp;code_challenge=$C&amp;code_challenge_method=S256"</pre><p>アドレスバーの code (1分以内) を次のコマンドで token に交換し、ID トークンの <code>nonce</code> を読む。</p><pre>CODE=ここにcode
curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$V | jq -r .id_token | cut -d. -f2 | tr '_-' '/+' | awk '{while(length($0)%4)$0=$0"=";print}' | base64 -d | jq '{nonce}'</pre><div class="check"><b>確認</b><pre class="out">{ "nonce": "my-nonce-123" }
{ "nonce": null }          (nonce を送らなかったとき)</pre></div><div class="read"><b>読み方</b><p><code>nonce</code> に送った値が出る。nonce を付けずに認可 URL を開いて同様に交換すると <code>null</code> になる。</p><p>送った値がそのまま出るのは、Keycloak が nonce を署名つきの ID トークンに埋め込むから (途中で書き換えると署名が壊れる)。送らなければ claim も出ない。Authorization Code Flow では任意 (Implicit / Hybrid では必須) だが、コストがほぼ無いので付けるのが定石。state は URL に付いて戻る署名なしの値でアプリが戻りで照合し、nonce は署名された ID トークンの中で ID トークン検証時に照合する。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l03-p02', title: `nonce はログインごとに変わる`,
        html: `<p class="goal">やりたいこと: nonce が「1回限りの合言葉」であることを、ログインを2回行って確かめる。古いログインの ID トークンは今回の nonce と一致しない、というリプレイ防止の仕組みを見る。</p><div class="step"><h4>手順 1　2回ログインして nonce を比べる</h4><p>SPA で login し、画面の ID トークンの <code>nonce</code> を控える (A)。SSO セッションを残したまま SPA をリロードしてもう一度 login し (Keycloak の SSO で画面なしに戻る)、<code>nonce</code> を控える (B)。</p><div class="check"><b>確認</b><pre class="out">A: "nonce": "kP1x…"
B: "nonce": "Zq9m…"      (A と違う)</pre></div><div class="read"><b>読み方</b><p>A と B が違う値になる。</p><p>nonce はログインごとに新しく作られる (SPA の <code>rand(16)</code>)。2回目が画面なしで戻るのは SSO セッション (Cookie) が残っているためで、nonce は毎回変わる。</p></div></div><div class="step"><h4>手順 2　古い nonce を今回の値と照合する</h4><p>A を使って、「古い ID トークン」を今回のログインに差し込んだ場合の照合をシェルで再現する。</p><pre>OLD=A の nonce 値
NEW=B の nonce 値
[ "$OLD" = "$NEW" ] &amp;&amp; echo accept || echo reject</pre><div class="check"><b>確認</b><pre class="out">reject</pre></div><div class="read"><b>読み方</b><p><code>reject</code> と出る。</p><p>古い ID トークン (本物の署名つき) を差し込まれても、今回保存した nonce と合わないので拒否できる。署名・<code>iss</code>・<code>aud</code>・<code>exp</code> は「本物か」しか示さず、「今回のログインのものか」は nonce が補う。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l03-p03', title: `nonce を故意に壊して、アプリが ID トークンを拒否するのを見る`,
        html: `<p class="goal">やりたいこと: ID トークンの <code>nonce</code> が保存した値と一致しないとき、アプリは ID トークンを拒否しなければならない。l02 p04 で足した <code>?break=</code> スイッチで nonce を壊し、拒否されるのを確かめる。</p><div class="step"><h4>手順 1　nonce を壊してログインする</h4><p>前提: l02 p04 で SPA に <code>break</code> のスイッチを足している。</p><p><code>http://localhost:3000/?break=nonce</code> を開き、「login」を押してログインを完了する。</p><div class="check"><b>確認</b><pre class="out">## 1. callback
{ … }
## 2. token response (keys)
[ … ]
## 3. id_token
{ …, "nonce": "aB3d…" }
## NONCE MISMATCH -&gt; 中止
{ "got": "aB3d…", "saved": "tampered" }</pre></div><div class="read"><b>読み方</b><p>画面の出力に <code>NONCE MISMATCH</code> が出る。</p><p>token 交換までは成功し、ID トークンの検証で止まる。state と違い、nonce の照合は ID トークンを受け取った後にある (ID トークンの中の値を見るため)。「4. access_token」が出ないのは、アプリが検証失敗でログインを中止している正しい動き。通ってしまうなら nonce を照合していない実装で、古い ID トークンの差し込み (リプレイ) に弱い。実際のライブラリ (oidc-client, Spring Security 等) は nonce を自動で付けて検証する。自作するときは必ず同じことを書く。</p></div></div><div class="step"><h4>手順 2　break なしで通ることを確かめる</h4><p><code>http://localhost:3000/</code> (break なし) でもう一度 login する。</p><div class="check"><b>確認</b><pre class="out">「4. access_token」まで表示される。</pre></div><div class="read"><b>読み方</b><p>通常は通り、壊したときだけ止まる。照合が壊れたログインだけを拒否できている。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c07-l04', title: `PKCE`, pages: [
      { id: 'c07-l04-p01', title: `code_challenge を手で計算して、鍵と錠の関係を確かめる`,
        html: `<p class="goal">やりたいこと: PKCE は「code を盗んでも、最初にログインを始めた本人 (アプリ) でなければトークンに交換できない」ようにする仕組み。鍵 (<code>code_verifier</code>) のハッシュが錠 (<code>code_challenge</code>) であることを、自分で計算して確かめる。</p><div class="step"><h4>手順 1　固定の verifier から challenge を計算する</h4><pre>V=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
printf '%s' "$V" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='; echo</pre><div class="check"><b>確認</b><pre class="out">E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</pre></div><div class="read"><b>読み方</b><p>出力が次の値と一致する。</p><p>一致すれば <code>code_challenge = BASE64URL(SHA256(code_verifier))</code> の計算式が合っている。</p></div></div><div class="step"><h4>手順 2　verifier を1文字変える</h4><pre>printf '%s' "\${V}x" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='; echo</pre><div class="check"><b>確認</b><pre class="out">(別の値)</pre></div><div class="read"><b>読み方</b><p>手順1とは別の値が出る。</p><p>1文字変えると全く別の値になる。ハッシュは一方向なので、challenge (URL に出る) から verifier (鍵) を逆算できない。URL に出るのは challenge だけで、verifier は token 交換のときに直接送る (URL を経由しない) ので、code を盗んだ人は verifier を知らない。</p></div></div><div class="step"><h4>手順 3　ランダムな verifier を作る</h4><p>アプリがログインごとにしていることを自分で行う。</p><pre>V=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\\n' | cut -c1-64)
C=$(printf '%s' "$V" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
echo "verifier=$V"; echo "challenge=$C"</pre><div class="check"><b>確認</b><pre class="out">verifier=…64文字…
challenge=…43文字…</pre></div><div class="read"><b>読み方</b><p>verifier が64文字、challenge が43文字で出る。</p><p>ログインごとに新しい鍵と錠を作る。<code>code_challenge_method=plain</code> は challenge = verifier そのままで、URL を見られると鍵が丸見えになるので、必ず S256 を使う。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l04-p02', title: `PKCE が正しく動くとき: SPA の通信を観察する`,
        html: `<p class="goal">やりたいこと: SPA のログインを PKCE の観点で観察する。auth には challenge だけ、token には verifier だけが出ることを Network タブで確認し、鍵が URL に出ないことを目で見る。</p><div class="step"><h4>手順 1　auth・戻り・token の値を見る</h4><p>SPA で開発者ツールの Network タブ (Preserve log On) を開き、login する。<code>auth?...</code> の <code>code_challenge</code> と <code>code_challenge_method</code>、戻りの URL (<code>?code=...</code>)、<code>token</code> の Payload の <code>code_verifier</code> を読む。</p><div class="check"><b>確認</b><pre class="out">auth:  code_challenge=…  code_challenge_method=S256
戻り:  ?iss=…&amp;code=…&amp;state=…        (code_verifier は無い)
token: code_verifier=…</pre></div><div class="read"><b>読み方</b><p>challenge は auth にだけ、verifier は token にだけ出る。</p><p>code が戻る URL に verifier が無いので、盗まれる可能性のある経路 (URL) に鍵は出ない。</p></div></div><div class="step"><h4>手順 2　verifier を challenge に変換して照合する</h4><p>token の <code>code_verifier</code> の値を、前ページの式で challenge に変換する。</p><pre>V=ここにtokenリクエストのcode_verifier
printf '%s' "$V" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='; echo</pre><div class="check"><b>確認</b><pre class="out">計算結果 = auth の code_challenge  → 一致</pre></div><div class="read"><b>読み方</b><p>計算結果が auth の <code>code_challenge</code> と一致する。</p><p>Keycloak は token 交換時に同じ計算をして、記憶していた challenge と照合する。Public client には secret が無いので、この使い捨ての鍵が本人確認の代わり。Confidential でも併用が推奨 (OAuth 2.1 では全クライアントで必須)。守る対象は state = 戻り URL (アプリが照合)、nonce = ID トークン (アプリが照合)、PKCE = code (Keycloak が照合)。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l04-p03', title: `verifier を壊して、Keycloak が code を拒否するのを見る`,
        html: `<p class="goal">やりたいこと: code を盗んだ攻撃者は verifier を知らない。この状況を、verifier を間違えて token 交換することで再現し、Keycloak が拒否することを確かめる。</p><div class="step"><h4>手順 1　SPA で verifier を壊す</h4><p><code>http://localhost:3000/?break=verifier</code> (l02 p04 のスイッチ) を開いて「login」を押す。</p><div class="check"><b>確認</b><pre class="out">## token error 400
{ "error": "invalid_grant", "error_description": "PKCE verification failed: Code mismatch" }</pre></div><div class="read"><b>読み方</b><p>画面の出力を読む。</p><p>Keycloak が verifier のハッシュと保存済み challenge を比べて、不一致で拒否した。code を盗まれても、鍵を持たない人は交換できない。正常なログインでこのエラーが出るなら、アプリが verifier を保存していないか、ログインごとに別の値を使っている。</p></div></div><div class="step"><h4>手順 2　手動で違う verifier を使い、その後正しい verifier を試す</h4><p>l02 p02 の手順で code を取り (<code>C</code> と対の <code>V</code> を使う)、違う verifier で交換する。</p><pre>V=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk; C=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
open "$OIDC/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;code_challenge=$C&amp;code_challenge_method=S256"
CODE=ここにcode
curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=wrong-verifier-wrong-verifier-wrong-verifier-0123456789 | jq</pre><p>同じ code を、正しい verifier で交換する。</p><pre>curl -s -X POST $OIDC/token -d grant_type=authorization_code -d client_id=frontend-spa -d code=$CODE -d redirect_uri=http://localhost:3000/manual -d code_verifier=$V | jq</pre><div class="check"><b>確認</b><pre class="out">{ "error": "invalid_grant", "error_description": "Code not valid" }</pre></div><div class="read"><b>読み方</b><p>間違った verifier では上と同じ <code>PKCE verification failed</code>、続く正しい verifier では次のエラーが返る。</p><p>検証に失敗した code は無効化され、その後に正しい verifier で試しても <code>Code not valid</code> になる。攻撃者に何度も試させない。逆に token 交換が成功してしまうなら、Client の PKCE 設定や challenge の送り忘れ (p04 で確認する)。</p></div></div>`,
        oxIds: [] },
      { id: 'c07-l04-p04', title: `PKCE を強制し、plain や challenge なしを拒否させる`,
        html: `<p class="goal">やりたいこと: アプリが PKCE を付け忘れても安全にするには、Client 側で PKCE Method を <code>S256</code> に固定する。<code>plain</code> や challenge なしのリクエストが拒否されるのを確かめる。</p><div class="step"><h4>手順 1　challenge なし・plain で認可リクエストを開く</h4><p>前提: <code>frontend-spa</code> の Advanced タブで PKCE Method = <code>S256</code> (第5章 l01 p04)。<code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。</p><p>challenge なしで開く。</p><pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;prompt=login"</pre><p><code>plain</code> を指定して開く。</p><pre>open "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;code_challenge=my-plain-verifier-0123456789-0123456789-0123&amp;code_challenge_method=plain&amp;prompt=login"</pre><div class="check"><b>確認</b><pre class="out">?error=invalid_request&amp;error_description=Missing+parameter%3A+code_challenge_method                                   (challenge なし)
?error=invalid_request&amp;error_description=Invalid+parameter%3A+code+challenge+method+is+not+matching+the+configured+one   (plain)</pre></div><div class="read"><b>読み方</b><p>どちらもログイン画面が出ず、redirect_uri (http://localhost:3000/manual) にエラー付きで戻される (そこは何も動いていないので「接続できません」になるが、アドレスバーを読む)。</p><p>強制中は <code>error=invalid_request</code> で戻されるので、PKCE を付けない・弱い方式のアプリは動かず、付け忘れが事故にならない。<code>plain</code> は URL に鍵が丸見えで実質無意味。</p></div></div><div class="step"><h4>手順 2　PKCE Method を未設定にして比べる</h4><p><code>frontend-spa</code> の PKCE Method を空 (未設定) にして「Save」し、手順1の2つをもう一度開く (<code>prompt=login</code> は SSO が残っていてもログイン画面を出す指定)。確認後、必ず <code>S256</code> に戻す。</p><div class="check"><b>確認</b><pre class="out">どちらもログイン画面が出る。</pre></div><div class="read"><b>読み方</b><p>未設定だと、アプリが付ければ PKCE が使われるが付けなければ使われない。クライアント側で強制しておくのが安全。戻し忘れると PKCE を前提にする他の確認がずれる。</p></div></div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
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
// 第9章 ハンズオン形式
DATA.chapters.push({
  no: 9, title: `その他のフロー`,
  lessons: [
    { id: 'c09-l01', title: `Client Credentials Flow`, pages: [
      { id: 'c09-l01-p01', title: `batch-job でユーザー不在のトークンを取る`,
        html: `<p class="goal">やりたいこと: 夜間バッチやマイクロサービス間のように、ユーザーがいない場面では、クライアント自身が secret でトークンを取る (Client Credentials Flow)。<code>batch-job</code> で実際に取り、「誰のトークンか」を claim で読む。</p><div class="step"><h4>手順 1　トークンを取る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>batch-job</code> が Client authentication On・Service accounts roles On で作成済み (第6章 l01 p03)、secret は <code>$BATCH_SECRET</code>。</p><pre>R=$(curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials)
echo $R | jq 'keys'</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "not-before-policy", "refresh_expires_in", "scope", "token_type" ]</pre></div><div class="read"><b>読み方</b><p>返ったキーの一覧を見る。</p><p><code>refresh_token</code> と <code>id_token</code> が無いのは、ユーザー不在なので「ログインの結果 (ID トークン)」も「更新 (Refresh)」も無いから。期限が切れたら、また <code>POST /token</code> するだけ。</p><ul><li><code>unauthorized_client: Client not enabled to retrieve service account</code> → Service accounts roles が Off。</li><li><code>Public client not allowed ...</code> → Client authentication が Off。</li><li><code>invalid_client</code> / <code>Invalid client credentials</code> → secret の誤り。</li></ul></div></div><div class="step"><h4>手順 2　claim を読む</h4><pre>BA=$(echo $R | jq -r .access_token)
jwt $BA | jq '{sub, preferred_username, azp, client_id, scope, realm_access}'</pre><div class="check"><b>確認</b><pre class="out">{
  "sub": "…uuid…",
  "preferred_username": "service-account-batch-job",
  "azp": "batch-job",
  "client_id": "batch-job",
  "scope": "email profile",
  "realm_access": { "roles": ["default-roles-demo", …] }
}</pre></div><div class="read"><b>読み方</b><p>claim が出る。</p><p><code>preferred_username</code> が <code>service-account-batch-job</code>、<code>sub</code> はそのユーザーの UUID。クライアントごとに専用の「サービスアカウントユーザー」が裏にあり、ロールもこのユーザーに付ける。管理コンソール「Users」で <code>service-account</code> を検索するか、「Clients」→ <code>batch-job</code> →「Service accounts roles」タブでリンクされたユーザー名を確認できる。</p></div></div><div class="step"><h4>手順 3　API をこのトークンで呼ぶ</h4><p>API (<code>:4000</code>、第8章) を呼ぶ。</p><pre>curl -s -H "Authorization: Bearer $BA" localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">{ "sub": "…", "username": "service-account-batch-job", "azp": "batch-job", "aud": … }</pre></div><div class="read"><b>読み方</b><p><code>/me</code> が 200 で応答する。</p><p>API から見ればユーザーのトークンと同じ Bearer。違いは claim (人か、サービスか)。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l01-p02', title: `サービスアカウントにロールと scope を付けて、API の認可を通す`,
        html: `<p class="goal">やりたいこと: サービスアカウントの権限は、Service accounts roles タブで付けるロールと、Client scopes で付けるスコープで決まる。自作 API の <code>/admin</code> (要 role <code>admin</code>) と <code>/orders</code> (要 scope <code>orders:read</code>) を、403 から 200 に変える。</p><div class="step"><h4>手順 1　現状を確認する</h4><p>前提: API (<code>:4000</code>) が動いている。<code>orders:read</code> の Client Scope は作成済み (第4章 l01 p05)。</p><pre>BA=$(curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | jq -r .access_token)
curl -s -o /dev/null -w '/admin: %{http_code}\\n' -H "Authorization: Bearer $BA" localhost:4000/admin
curl -s -o /dev/null -w '/orders: %{http_code}\\n' -H "Authorization: Bearer $BA" localhost:4000/orders</pre><div class="check"><b>確認</b><pre class="out">/admin: 403
/orders: 403</pre></div><div class="read"><b>読み方</b><p>どちらも 403 になる。</p><p>権限を付ける前は、トークンは有効でも認可が通らない。</p></div></div><div class="step"><h4>手順 2　ロールと scope を付けて取り直す</h4><p>管理コンソール「Clients」→ <code>batch-job</code> →「Service accounts roles」タブ →「Assign role」を押し、「Filter by realm roles」に切り替えて <code>admin</code> を選び「Assign」を押す。続けて「Client scopes」タブ →「Add client scope」で <code>orders:read</code> を <code>Default</code> として追加する。</p><pre>BA=$(curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | jq -r .access_token)
jwt $BA | jq -c '{scope, roles: .realm_access.roles}'
curl -s -o /dev/null -w '/admin: %{http_code}\\n' -H "Authorization: Bearer $BA" localhost:4000/admin
curl -s -o /dev/null -w '/orders: %{http_code}\\n' -H "Authorization: Bearer $BA" localhost:4000/orders</pre><div class="check"><b>確認</b><pre class="out">{"scope":"email orders:read profile","roles":["default-roles-demo","admin",…]}
/admin: 200
/orders: 200</pre></div><div class="read"><b>読み方</b><p>claim にロールと scope が載り、どちらも 200 になる。</p><p>サービスアカウントの権限もロール (<code>realm_access.roles</code>) で表し、ユーザーと同じ仕組み。<code>orders:read</code> を Default にすると <code>scope</code> を指定しなくても載る。サービスアカウントは対話しないので、Default にするのが普通。</p><ul><li>追加したのに反映されない → 発行済みのトークンは変わらない。取り直す。</li><li>ロールが載らない → batch-job の Client scopes → <code>batch-job-dedicated</code> → Scope タブの Full scope allowed が Off の可能性 (第4章 l04 p04)。</li></ul></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c09-l02', title: `Refresh Token Flow`, pages: [
      { id: 'c09-l02-p01', title: `Refresh Token で、ログインし直さずに Access Token を取り直す`,
        html: `<p class="goal">やりたいこと: Access Token は5分で切れる。そのたびにログインを要求する代わりに、Refresh Token で新しい Access Token を取る。取り直すと何が変わり、何が変わらないかを確かめる。</p><div class="step"><h4>手順 1　ログインしてトークン一式を取る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。</p><pre>T=$(get_token alice)
AT1=$(echo $T | jq -r .access_token); RT1=$(echo $T | jq -r .refresh_token)
jwt $AT1 | jq -c '{jti, sid, exp}'</pre><div class="check"><b>確認</b><pre class="out">{"jti":"aaa…","sid":"S1…","exp":1760000300}</pre></div><div class="read"><b>読み方</b><p><code>jti</code>・<code>sid</code>・<code>exp</code> が出る。</p><p>これが取り直し前の Access Token の識別子とセッション ID。</p></div></div><div class="step"><h4>手順 2　Refresh Token で取り直す</h4><pre>T2=$(curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT1)
AT2=$(echo $T2 | jq -r .access_token); RT2=$(echo $T2 | jq -r .refresh_token)
jwt $AT2 | jq -c '{jti, sid, exp}'
echo $T2 | jq 'keys'</pre><div class="check"><b>確認</b><pre class="out">{"jti":"bbb…","sid":"S1…","exp":1760000560}
[ "access_token", "expires_in", "id_token", …, "refresh_token", … ]</pre></div><div class="read"><b>読み方</b><p><code>sid</code> は同じで <code>jti</code> が新しく、<code>refresh_token</code> も返る。</p><p><code>sid</code> が同じで <code>jti</code> が新しいので、同じログインセッションのまま新しい Access Token が発行された。<code>exp</code> も取り直した時刻から数え直される (続けて実行すると同じ秒になることもある)。ユーザーは何も操作していない。Confidential client (<code>backend-web</code>) では、refresh にも <code>-u backend-web:$WEB_SECRET</code> が必要。<code>invalid_grant</code> の原因は次ページ以降を参照。</p></div></div><div class="step"><h4>手順 3　新旧の Refresh Token を比べる</h4><pre>[ "$RT1" = "$RT2" ] &amp;&amp; echo same || echo different
jwth $RT1 | jq -c .alg
jwt $RT2 | jq -c '{typ, exp}'</pre><div class="check"><b>確認</b><pre class="out">different
"HS512"
{"typ":"Refresh","exp":…}</pre></div><div class="read"><b>読み方</b><p>別の文字列で、<code>HS512</code> の Refresh タイプ。</p><p>Refresh Token も更新される (有効期限は Session の寿命に従う)。<code>Refresh</code> タイプの JWT で Keycloak 宛なので、API に送るものではない。Access Token だけを Bearer で送る。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l02-p02', title: `Refresh Token Rotation: 古い Refresh Token を使えなくする`,
        html: `<p class="goal">やりたいこと: Refresh Token が盗まれると、期限まで無限に Access Token を取られる。Revoke Refresh Token (Rotation) を On にすると、Refresh Token は<b>1回使い切り</b>になり、使い回しを検知できる。Off / On で挙動の違いを確かめる。</p><div class="step"><h4>手順 1　Off (既定) で同じ Refresh Token を2回使う</h4><pre>RT=$(get_token alice | jq -r .refresh_token)
for i in 1 2; do curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT | jq -c '{ok: has("access_token"), error}'; done</pre><div class="check"><b>確認</b><pre class="out">(Off)  {"ok":true,"error":null}  {"ok":true,"error":null}</pre></div><div class="read"><b>読み方</b><p>2回とも成功する。</p><p>同じ Refresh Token を何度でも使えるので、盗まれても検知できない。</p></div></div><div class="step"><h4>手順 2　On にして同じ Refresh Token を2回使う</h4><p>管理コンソール「Realm settings」→「Tokens」タブの「Revoke Refresh Token」を <code>On</code> にして「Save」を押す。新しい RT を取り直してから試す。</p><pre>RT=$(get_token alice | jq -r .refresh_token)
for i in 1 2; do curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT | jq -c '{ok: has("access_token"), error, error_description}'; done</pre><div class="check"><b>確認</b><pre class="out">(On)   {"ok":true,…}  {"ok":false,"error":"invalid_grant","error_description":"Maximum allowed refresh token reuse exceeded"}</pre></div><div class="read"><b>読み方</b><p>2回目が失敗する。</p><p>使用済みの Refresh Token は使えない。攻撃者が盗んだ古い RT を使うと失敗する (正規ユーザーが先に使っていれば)。正規ユーザーの更新が失敗し始めたら、誰かが同じ RT を先に使った (漏洩) 疑い。</p></div></div><div class="step"><h4>手順 3　毎回新しい Refresh Token を使う</h4><pre>RT=$(get_token alice | jq -r .refresh_token)
for i in 1 2 3; do R=$(curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT); RT=$(echo $R | jq -r .refresh_token); echo $R | jq -c '{ok: has("access_token")}'; done</pre><div class="check"><b>確認</b><pre class="out">(On, 正しい使い方) {"ok":true} {"ok":true} {"ok":true}</pre></div><div class="read"><b>読み方</b><p>3回とも成功する。</p><p>毎回返された新しい Refresh Token で置き換えるアプリなら、On でも問題なく動く。アプリは必ず「レスポンスの refresh_token で置き換える」実装にする。確認後、「Revoke Refresh Token」を <code>Off</code> に戻す。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l02-p03', title: `Refresh が失敗するとき (期限切れ・セッション終了) と、API 401 からの復帰`,
        html: `<p class="goal">やりたいこと: Access Token が期限切れで API が 401 になったとき、アプリは Refresh Token で取り直して再試行する。Refresh も失敗するとき (セッションが無い) は再ログインに戻す。この一連の流れを再現する。</p><div class="step"><h4>手順 1　期限切れで 401 を出す</h4><p>前提: API (<code>:4000</code>) が動いている。この手順では一時的に Access Token の寿命を短くする。「Realm settings」→「Tokens」の「Access Token Lifespan」を <code>1 Minutes</code> にして「Save」を押す。</p><pre>T=$(get_token alice); AT=$(echo $T | jq -r .access_token); RT=$(echo $T | jq -r .refresh_token)
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/me
sleep 65
curl -s -H "Authorization: Bearer $AT" localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">200
{ "error": "invalid_token", "reason": "ERR_JWT_EXPIRED: \\"exp\\" claim timestamp check failed" }</pre></div><div class="read"><b>読み方</b><p>最初は 200、65 秒後は 401 の本文が返る。</p><p><code>ERR_JWT_EXPIRED</code> は Access Token の寿命。アプリは 401 を受けたら「Refresh して1回だけ再試行」する。</p></div></div><div class="step"><h4>手順 2　Refresh で取り直して API を呼ぶ</h4><pre>AT=$(curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT | jq -r .access_token)
curl -s -o /dev/null -w '%{http_code}\\n' -H "Authorization: Bearer $AT" localhost:4000/me</pre><div class="check"><b>確認</b><pre class="out">200</pre></div><div class="read"><b>読み方</b><p>200 に戻る。</p><p>Refresh で取り直せば 200 に戻る。Access Token の寿命 (短い) と Refresh / Session の寿命 (長い) は別。</p></div></div><div class="step"><h4>手順 3　セッションを終わらせて Refresh する</h4><p>管理コンソール「Sessions」で alice の行を「Sign out」してから、もう一度 Refresh する。</p><pre>curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT | jq</pre><div class="check"><b>確認</b><pre class="out">{ "error": "invalid_grant", "error_description": "Session not active" }    (または Token is not active)</pre></div><div class="read"><b>読み方</b><p><code>invalid_grant</code> が返る。</p><p>土台のセッションが無くなったので Refresh Token も使えない。再ログイン (認可リクエスト) に戻す。同じエラーはセッション期限切れ (SSO Session Idle / Max) でも起きる。確認後、Access Token Lifespan を <code>5 Minutes</code> に戻す。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c09-l03', title: `Password Grant (非推奨) と Device Grant`, pages: [
      { id: 'c09-l03-p01', title: `Password Grant: これまで使ってきた方式の問題点を確かめる`,
        html: `<p class="goal">やりたいこと: これまで <code>get_token</code> で使ってきたのは Password Grant (Direct access grants)。アプリが ID とパスワードを直接受け取る方式で、OAuth 2.1 では廃止された。何が問題かを、MFA が通らないことで確かめる。</p><div class="step"><h4>手順 1　Password Grant が通ることを見る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>frontend-spa</code> の Direct access grants は On。</p><pre>curl -s -X POST $OIDC/token -d grant_type=password -d client_id=frontend-spa -d username=bob -d password=bob -d scope=openid | jq 'has("access_token")'</pre><div class="check"><b>確認</b><pre class="out">true</pre></div><div class="read"><b>読み方</b><p><code>true</code> が出る。</p><p>アプリがユーザーのパスワードを直接見ている。アプリが漏洩したらパスワードも漏れるので、Keycloak にだけパスワードを渡すのが本来の形。</p></div></div><div class="step"><h4>手順 2　bob に OTP を必須にして比べる</h4><p>管理コンソール「Users」→ <code>bob</code> →「Details」の Required user actions で <code>Configure OTP</code> を選んで「Save」を押す。もう一度 Password Grant を試し、ブラウザ (シークレットウィンドウ) でも bob としてログインする。</p><pre>curl -s -X POST $OIDC/token -d grant_type=password -d client_id=frontend-spa -d username=bob -d password=bob -d scope=openid | jq
open "$OIDC/auth?client_id=frontend-spa&amp;prompt=login&amp;response_type=code&amp;redirect_uri=http://localhost:3000/manual&amp;scope=openid&amp;code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&amp;code_challenge_method=S256"</pre><div class="check"><b>確認</b><pre class="out">{ "error": "invalid_grant", "error_description": "Account is not fully set up" }
(ブラウザ)  「Mobile Authenticator Setup」(OTP の設定画面) が出る</pre></div><div class="read"><b>読み方</b><p>Password Grant はエラー、ブラウザは OTP の設定画面が出る。</p><p>Password Grant は MFA・SSO・ソーシャルログインなどの追加の画面を挟めない。ログイン画面を Keycloak に任せる Authorization Code Flow なら、それらが全部使える。使ってよい場面はテスト・移行の一時的な用途だけで、本番のクライアントでは Off にする (第5章 l01 p02)。この教材では観察を簡単にするために On にしてきたので、<code>get_token</code> を使う間は <code>frontend-spa</code> の Direct access grants を On のままでよい。確認後、bob の Required user actions から <code>Configure OTP</code> を外して「Save」を押す。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l03-p02', title: `Device Authorization Grant: 機器側から認可を開始する`,
        html: `<p class="goal">やりたいこと: TV や CLI のようにブラウザ入力が難しい機器では、Device Authorization Grant を使う。機器は短いコード (<code>user_code</code>) を表示し、ユーザーが別の端末で承認する。機器側の動きを curl で再現する。</p><div class="step"><h4>手順 1　デバイス認可リクエストを送る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>frontend-spa</code> の Capability config で「OAuth 2.0 Device Authorization Grant」が On (第2章 l02 p02 で On にした場合はそのまま)。</p><pre>V=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk; C=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM   # 第5章で PKCE S256 を強制しているので、機器側も challenge / verifier を使う
DEV=$(curl -s -X POST $OIDC/auth/device -d client_id=frontend-spa -d scope=openid -d code_challenge=$C -d code_challenge_method=S256)
echo $DEV | jq
DC=$(echo $DEV | jq -r .device_code)</pre><div class="check"><b>確認</b><pre class="out">{
  "device_code": "…",
  "user_code": "ABCD-EFGH",
  "verification_uri": "http://localhost:8080/realms/demo/device",
  "verification_uri_complete": "http://localhost:8080/realms/demo/device?user_code=ABCD-EFGH",
  "expires_in": 600,
  "interval": 5
}</pre></div><div class="read"><b>読み方</b><p><code>user_code</code> と <code>verification_uri</code> が返る。</p><p>機器は画面に「<code>verification_uri</code> を別端末で開き、<code>user_code</code> を入力してください」と表示する。<code>device_code</code> は機器だけが持つ秘密。機器自体は Public でよい (ブラウザを使えないので secret を持てないことが多い)。</p><ul><li><code>unauthorized_client</code> → Device Authorization Grant が On でない (第2章 l02 p02)。</li><li><code>invalid_request</code> と <code>Missing parameter: code_challenge_method</code> → frontend-spa で PKCE S256 を強制している (第5章) のに、デバイス認可リクエストに <code>code_challenge</code> を付けていない。</li></ul></div></div><div class="step"><h4>手順 2　承認前にポーリングする</h4><pre>POLL() { curl -s -X POST $OIDC/token -d grant_type=urn:ietf:params:oauth:grant-type:device_code -d client_id=frontend-spa -d device_code=$DC -d code_verifier=$V; }
POLL | jq</pre><div class="check"><b>確認</b><pre class="out">{ "error": "authorization_pending", "error_description": "The authorization request is still pending" }</pre></div><div class="read"><b>読み方</b><p><code>authorization_pending</code> が返る。</p><p>まだユーザーが承認していない。<code>interval</code> 秒ごとに繰り返す。</p></div></div><div class="step"><h4>手順 3　間隔を守らずに続けて呼ぶ</h4><pre>POLL | jq -c .error; POLL | jq -c .error</pre><div class="check"><b>確認</b><pre class="out">"authorization_pending"
"slow_down"</pre></div><div class="read"><b>読み方</b><p>2回目が <code>slow_down</code> になる。</p><p>間隔より早く呼ぶと <code>slow_down</code> が返る。間隔を延ばす。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l03-p03', title: `別の端末で承認して、トークンを受け取る`,
        html: `<p class="goal">やりたいこと: デバイス認可の後半。ユーザーが別端末 (ここでは同じ PC のブラウザ) で <code>user_code</code> を入力・ログイン・承認すると、機器のポーリングがトークンを受け取れることを確かめる。</p><div class="step"><h4>手順 1　別端末役のブラウザで承認する</h4><p>前提: 前ページの <code>DEV</code> <code>DC</code> がある (<code>expires_in</code> は600秒)。切れていたら前ページからやり直す。</p><pre>open "$(echo $DEV | jq -r .verification_uri_complete)"</pre><p>画面の user_code を確認して送信し、<code>alice</code> / <code>alice</code> でログインする。同意画面が出たら承認する。</p><div class="check"><b>確認</b><pre class="out">ブラウザに承認完了の旨の画面が出る。</pre></div><div class="read"><b>読み方</b><p>ログイン (パスワード・MFA) は Keycloak の画面で別端末が行ったので、機器はパスワードを知らない。<code>user_code</code> を間違えて入力した場合は画面でエラー (「Invalid code」の趣旨)、ユーザーが拒否すると機器側は <code>access_denied</code>、承認せずに <code>expires_in</code> を過ぎると <code>expired_token</code> になり、機器はやり直す。</p></div></div><div class="step"><h4>手順 2　機器側でポーリングする</h4><pre>POLL | jq 'keys'
POLL | jq -c .error</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "id_token", "not-before-policy", "refresh_expires_in", "refresh_token", "scope", "session_state", "token_type" ]
"invalid_grant"      ← 同じ device_code の2回目は使えない</pre></div><div class="read"><b>読み方</b><p>1回目はトークンのキー、同じ device_code の2回目は <code>invalid_grant</code>。</p><p>承認後のポーリングでトークンが返り、機器はブラウザを一切使わずにログイン済みユーザーのトークンを得た。<code>device_code</code> は1回使い切り。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c09-l04', title: `Token Exchange と Logout`, pages: [
      { id: 'c09-l04-p01', title: `Token Exchange: 手持ちのトークンを別の audience 用に交換する`,
        html: `<p class="goal">やりたいこと: サービス A がユーザーのトークンを持っていて、そのユーザーの権限でサービス B を呼びたい。トークンを使い回さず、B 宛の新しいトークンに交換する。Keycloak 26.2 以降の Standard Token Exchange (RFC 8693) を、<code>backend-web</code> から <code>api-service</code> 宛で試す。</p><div class="step"><h4>手順 1　Standard Token Exchange を有効にして元のトークンを取る</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>backend-web</code> (Confidential、Direct access grants On) と <code>$WEB_SECRET</code>。<code>api-service</code> が存在し、alice に <code>api-service</code> の Client Role <code>read</code> を付与済み (第4章)。Keycloak 26.2 以降。</p><p><code>backend-web</code> →「Settings」→ Capability config の「Standard Token Exchange」にチェックして「Save」を押す (項目が無ければバージョンが古い)。<code>backend-web</code> として alice のトークンを取る。</p><pre>SUB=$(curl -s -X POST $OIDC/token -u backend-web:$WEB_SECRET -d grant_type=password -d username=alice -d password=alice -d scope=openid | jq -r .access_token)
jwt $SUB | jq -c '{azp, aud, sub, preferred_username}'</pre><div class="check"><b>確認</b><pre class="out">{"azp":"backend-web","aud":["api-service","account"],"sub":"…alice…","preferred_username":"alice"}   (alice は api-service のロールを持つので、交換前から aud に api-service が入っている)</pre></div><div class="read"><b>読み方</b><p><code>azp</code> が <code>backend-web</code> のトークンが出る。</p><p>これが交換前のトークン。項目が出ない・動かない場合は、Keycloak が 26.2 未満か設定が合っていない。</p></div></div><div class="step"><h4>手順 2　トークンを交換して API を呼ぶ</h4><pre>EX=$(curl -s -X POST $OIDC/token -u backend-web:$WEB_SECRET -d grant_type=urn:ietf:params:oauth:grant-type:token-exchange -d subject_token=$SUB -d subject_token_type=urn:ietf:params:oauth:token-type:access_token -d audience=api-service)
echo $EX | jq 'keys'
jwt $(echo $EX | jq -r .access_token) | jq -c '{azp, aud, sub, preferred_username}'
curl -s -H "Authorization: Bearer $(echo $EX | jq -r .access_token)" localhost:4000/me | jq -c .</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "issued_token_type", "refresh_expires_in", "scope", "token_type", … ]
{"azp":"backend-web","aud":"api-service","sub":"…同じ sub…","preferred_username":"alice"}</pre></div><div class="read"><b>読み方</b><p>交換後のトークンの <code>sub</code> が同じで <code>aud</code> が <code>api-service</code>。</p><p>同じユーザーの権限で、宛先だけを B 向けに替えた。API (B) は自分宛のトークンだけを受け取れる。<code>azp</code> は交換を要求した <code>backend-web</code> のままで、誰が交換したかが残る。ユーザーが不在のサーバー間なら、交換ではなく Client Credentials (第9章 l01) を使う。</p><ul><li><code>unsupported_grant_type</code> / <code>invalid_request</code> → Keycloak が 26.2 未満、または Standard Token Exchange が無効。旧方式 (Legacy / Preview 機能) は設定が異なる。</li><li><code>access_denied</code> / audience 関連のエラー → 交換後の audience が <code>api-service</code> の Client Role / スコープ許可と結びついていない。alice のロール付与と、<code>backend-web</code> の Client scopes を確認する。</li></ul></div></div><div class="step"><h4>手順 3　Standard Token Exchange を Off にして試す</h4><p>「Standard Token Exchange」を Off にして、同じ交換を試す。</p><div class="check"><b>確認</b><pre class="out">(Off にしたとき) { "error": "invalid_request", "error_description": "Standard token exchange is not enabled for the requested client" }</pre></div><div class="read"><b>読み方</b><p>エラーが返る。</p><p>交換は Client ごとに許可が必要。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l04-p02', title: `RP-Initiated Logout: SSO セッションを終わらせ、別アプリのログインも切れるのを見る`,
        html: `<p class="goal">やりたいこと: アプリ側のログアウトだけでは Keycloak のセッションが残る。RP-Initiated Logout で Keycloak のセッションを終わらせると、同じセッションを使っていた別アプリも次のログインでパスワードを求められる。SPA と Web アプリの SSO を使って確かめる。</p><div class="step"><h4>手順 1　2つのアプリで SSO する</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している)、Web アプリ (第6章 l01 p04 の <code>~/develop/kc-handson/web</code> で <code>CLIENT_SECRET=backend-webのsecret node server.js</code> を起動) が <code>:3000</code> / <code>:3001</code> で動いている。<code>frontend-spa</code> の Valid post logout redirect URIs = <code>http://localhost:3000/*</code>。</p><p>先に、管理コンソールの「Sessions」で「Action」→「Sign out all active sessions」→「Confirm」を押して、既存のセッションを全部消す。これまでの <code>get_token</code> (Password Grant) が作った alice のセッションが残っていると、ログアウトしても行が残り、消えたかどうか分からない。</p><p>ブラウザで SPA (<code>http://localhost:3000/</code>) の「login」を押し、<code>alice</code> でログインする (パスワードを入力する)。同じブラウザで <code>http://localhost:3001/</code> を開いて「login」を押す (パスワード入力なしで入れる)。</p><div class="check"><b>確認</b><pre class="out">Sessions: alice   Clients: frontend-spa, backend-web   (1つのセッションに2つのクライアント)</pre></div><div class="read"><b>読み方</b><p>管理コンソールの「Sessions」で、alice の行の Clients 列を見る。</p><p>1つの Session の Clients に2つ並ぶのが SSO の正体。1回のログインで作られたセッションを、複数のクライアントが共有している。</p></div></div><div class="step"><h4>手順 2　ログアウト URL で Keycloak のセッションを終わらせる</h4><p>SPA のタブの Console で、ID トークンを使ったログアウト URL を作って開く。</p><pre>location.href = 'http://localhost:8080/realms/demo/protocol/openid-connect/logout?id_token_hint=' + tokens.id_token + '&amp;post_logout_redirect_uri=' + encodeURIComponent('http://localhost:3000/') + '&amp;state=bye'</pre><div class="check"><b>確認</b><pre class="out">logout 後: http://localhost:3000/?state=bye
Sessions: alice の行が消える</pre></div><div class="read"><b>読み方</b><p><code>state=bye</code> 付きで SPA に戻り、管理コンソールの「Sessions」を再読み込みすると alice の行が消えている。</p><p><code>state=bye</code> が戻るので、アプリは state でログアウト戻りも照合できる。<code>post_logout_redirect_uri</code> を使うには <code>id_token_hint</code> か <code>client_id</code> が必要 (v18 以降)。どちらも無いと <code>Missing parameters: id_token_hint</code> のエラー画面になり、<code>client_id</code> だけで <code>id_token_hint</code> が無いと「Do you want to log out?」の確認画面が出る。<code>tokens</code> が undefined なら SPA をリロードしてしまった (トークンはメモリのみ)ので、もう一度 login する。</p></div></div><div class="step"><h4>手順 3　別アプリのログインが切れたことを見る</h4><p>Web アプリ (<code>http://localhost:3001/</code>) の「login」を押す。</p><div class="check"><b>確認</b><pre class="out">Web アプリの login → ログイン画面 (パスワードを再度求められる)</pre></div><div class="read"><b>読み方</b><p>ログイン画面が出て、パスワードを再度求められる。</p><p>Keycloak のセッションが終わったので、別アプリでも再ログインが必要になる。アプリ側のセッションだけを消してもこうはならない。</p></div></div><div class="step"><h4>手順 4　登録外の戻り先を試す</h4><p>別の ID トークンを取り、登録していない <code>post_logout_redirect_uri</code> を使う。</p><pre>IDT=$(get_token alice | jq -r .id_token)
open "$OIDC/logout?id_token_hint=$IDT&amp;post_logout_redirect_uri=http://evil.example/&amp;state=x"</pre><div class="check"><b>確認</b><pre class="out">エラー画面になる (「Invalid redirect uri」の趣旨)。</pre></div><div class="read"><b>読み方</b><p><code>post_logout_redirect_uri</code> は Valid post logout redirect URIs に登録した範囲のみ受け付ける。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l04-p03', title: `Refresh Token を直接失効して、アプリ側からセッションを終わらせる`,
        html: `<p class="goal">やりたいこと: ブラウザを経由しないアプリ (CLI やサーバー) は、<code>POST /logout</code> に Refresh Token を渡してセッションを終わらせる。終わった後、Refresh と introspection がどう変わるかを確かめる。</p><div class="step"><h4>手順 1　トークンを取って有効なことを確認する</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>api-service</code> と <code>$API_SECRET</code>。</p><pre>T=$(get_token alice); AT=$(echo $T | jq -r .access_token); RT=$(echo $T | jq -r .refresh_token)
curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq -c .active</pre><div class="check"><b>確認</b><pre class="out">true</pre></div><div class="read"><b>読み方</b><p><code>true</code> が出る。</p><p>ログアウト前は Access Token が有効。</p></div></div><div class="step"><h4>手順 2　Refresh Token を渡してログアウトする</h4><p>Public client は client_id のみ渡す。</p><pre>curl -s -o /dev/null -w '%{http_code}\\n' -X POST $OIDC/logout -d client_id=frontend-spa -d refresh_token=$RT</pre><div class="check"><b>確認</b><pre class="out">204</pre></div><div class="read"><b>読み方</b><p>204 が返る。</p><p>204 はログアウト成功。400 / <code>invalid_grant</code> が返るなら、Refresh Token がすでに失効している。</p></div></div><div class="step"><h4>手順 3　introspection と Refresh を試す</h4><pre>curl -s -u api-service:$API_SECRET -d token=$AT $OIDC/token/introspect | jq -c .active
curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT | jq -c '{error, error_description}'</pre><div class="check"><b>確認</b><pre class="out">false
{"error":"invalid_grant","error_description":"Session not active"}   (または Token is not active)</pre></div><div class="read"><b>読み方</b><p>どちらも使えなくなっている。</p><p>同じセッションの Access Token (introspection) と Refresh Token は以降使えない。Access Token の JWT をローカル検証するだけの API は期限まで通してしまう (第8章 l03 p02) ので、即時に拒否したいなら introspection。Access Token は署名付き文字列で「取り消せない」ため、寿命を短くする設計になっている。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l04-p04', title: `Back-Channel Logout: Keycloak からアプリのサーバーへ通知させる`,
        html: `<p class="goal">やりたいこと: 1つのアプリでログアウトしたとき、同じセッションを使う別アプリのサーバーにも「このセッションは終了」と伝えたい。Back-Channel Logout は、Keycloak がアプリのサーバーへ <code>logout_token</code> (JWT) を直接 POST する。受け口を <code>nc</code> で作って、実際に届くところを見る。</p><div class="step"><h4>手順 1　受け口を用意して通知先を設定する</h4><p>前提: <code>source ~/develop/kc-handson/kc-lab.sh</code> 済み。<code>backend-web</code> (Direct access grants On)。Keycloak は Docker 内、受け口はホスト上なので、Docker Desktop の <code>host.docker.internal</code> を使う (Linux では compose の <code>extra_hosts</code> に <code>host.docker.internal:host-gateway</code> が必要)。</p><p><code>backend-web</code> →「Settings」→ Logout settings の「Backchannel logout URL」に <code>http://host.docker.internal:9999/logout</code> を入力し、「Backchannel logout session required」を <code>On</code> にして「Save」を押す。別のターミナルで、受け口を起動する (Mac。Linux は <code>nc -l -p 9999</code>)。</p><pre>nc -l 9999 | tee /tmp/bc.txt</pre><div class="check"><b>確認</b><pre class="out">nc が待ち受け状態になり、何も表示されない。</pre></div><div class="read"><b>読み方</b><p><code>nc</code> が先に終了していると届かないので、次の手順の前に起動したままにする。</p></div></div><div class="step"><h4>手順 2　セッションを作ってログアウトする</h4><pre>RT=$(curl -s -X POST $OIDC/token -u backend-web:$WEB_SECRET -d grant_type=password -d username=alice -d password=alice -d scope=openid | jq -r .refresh_token)
curl -s -o /dev/null -w '%{http_code}\\n' -X POST $OIDC/logout -u backend-web:$WEB_SECRET -d refresh_token=$RT</pre><div class="check"><b>確認</b><pre class="out">POST /logout HTTP/1.1
Host: host.docker.internal:9999
Content-Type: application/x-www-form-urlencoded

logout_token=eyJhbGciOi…</pre></div><div class="read"><b>読み方</b><p><code>nc</code> のターミナルに届いた内容を読む (抜粋)。</p><p><code>POST /logout</code> が届けば、Keycloak がブラウザを介さずアプリのサーバーへ直接通知した。何も届かないなら、<code>host.docker.internal</code> に Keycloak コンテナから到達できない (Linux)、<code>nc</code> が先に終了した、または対象クライアントにセッションが無い。管理コンソールの Events (Realm settings → Events で保存を On) やログで確認する。</p></div></div><div class="step"><h4>手順 3　logout_token を decode する</h4><pre>LT=$(grep -o 'logout_token=[^&amp; ]*' /tmp/bc.txt | sed 's/logout_token=//')
jwt $LT | jq '{iss, aud, sub, sid, events}'</pre><div class="check"><b>確認</b><pre class="out">{
  "iss": "http://localhost:8080/realms/demo",
  "aud": "backend-web",
  "sub": "…alice の UUID…",
  "sid": "…セッション ID…",
  "events": { "http://schemas.openid.net/event/backchannel-logout": {} }
}</pre></div><div class="read"><b>読み方</b><p><code>events</code> に <code>backchannel-logout</code> がある。</p><p>アプリは <code>sid</code> から自分のセッションを探して破棄すればよい (<code>sid</code> があるのは「Backchannel logout session required」を On にしたため)。<code>events</code> で通常のトークンと区別でき、<code>logout_token</code> は検証してから使う (署名・iss・aud)。Front-Channel Logout はブラウザの iframe で各アプリのログアウト URL を開く方式で、ブラウザが閉じられていると届かないので、確実性は Back-Channel が上。確認後、Backchannel logout URL を空に戻す。</p></div></div>`,
        oxIds: [] },
    ] },
    { id: 'c09-l05', title: `SAML SSO と Identity Brokering`, pages: [
      { id: 'c09-l05-p01', title: `SAML SSO: SAMLResponse (署名つき XML) を受け取って読む`,
        html: `<p class="goal">やりたいこと: SAML は OIDC と同じ「SSO」の仕組みを XML で行う古い規格。用語が違う (Assertion ≈ ID トークン、Entity ID ≈ client_id、ACS URL ≈ redirect_uri)。SAML クライアントを作り、Keycloak がブラウザ経由で署名つき SAMLResponse を POST する様子を、<code>nc</code> の受け口で捕まえて読む。SP (アプリ) の実装は作らず、IdP (Keycloak) 側の動きに絞る。</p><div class="step"><h4>手順 1　SAML クライアントを作る</h4><p>前提: <code>http://localhost:8080/realms/demo/protocol/saml/descriptor</code> が返る (第1章)。</p><p>管理コンソール「Clients」→「Create client」で Client type = <code>SAML</code>、Client ID = <code>lab-saml-sp</code> にして「Next」を押す。Login settings: Valid redirect URIs = <code>http://localhost:9999/*</code>、IDP-Initiated SSO URL name = <code>lab-sp</code>、Master SAML Processing URL = <code>http://localhost:9999/acs</code> を入力して「Save」を押す。</p><div class="check"><b>確認</b><pre class="out">「Clients」の一覧に lab-saml-sp がある。</pre></div><div class="read"><b>読み方</b><p>SAML のクライアント設定項目は Keycloak のバージョンで細部が変わるので、画面の説明に従う。</p></div></div><div class="step"><h4>手順 2　ログインして SAMLResponse を捕まえる</h4><p>別のターミナルで、受け口を起動する (Mac。Linux は <code>nc -l -p 9999</code>)。</p><pre>nc -l 9999 &gt; /tmp/acs.txt</pre><p>ブラウザで IdP-Initiated の SSO URL を開き、<code>alice</code> でログインする。</p><pre>open http://localhost:8080/realms/demo/protocol/saml/clients/lab-sp</pre><p>ログイン後、<code>nc</code> を <code>Ctrl+C</code> で止め、SAMLResponse を取り出して decode する。</p><pre>grep -o 'SAMLResponse=[^&amp;]*' /tmp/acs.txt | sed 's/SAMLResponse=//; s/%2B/+/g; s/%2F/\\//g; s/%3D/=/g' | base64 -d | sed 's/&gt;&lt;/&gt;\\n&lt;/g' | grep -E 'Issuer|NameID|Attribute |AudienceRestriction|Audience&gt;|SignatureValue|DigestValue'</pre><div class="check"><b>確認</b><pre class="out">&lt;saml:Issuer&gt;http://localhost:8080/realms/demo&lt;/saml:Issuer&gt;
&lt;dsig:DigestValue&gt;…&lt;/dsig:DigestValue&gt;
&lt;dsig:SignatureValue&gt;…&lt;/dsig:SignatureValue&gt;
&lt;saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"&gt;alice&lt;/saml:NameID&gt;
&lt;saml:Audience&gt;lab-saml-sp&lt;/saml:Audience&gt;
&lt;saml:Attribute Name="Role" …&gt;</pre></div><div class="read"><b>読み方</b><p>Issuer・署名・NameID・Audience が出る (実際は Issuer が Response と Assertion の2か所に出て、Role の行は alice が持つロールの数だけ繰り返される。下は抜粋)。</p><p>OIDC との対応で読む。</p><ul><li>Issuer が realm の URL → どの IdP が発行したか (OIDC の <code>iss</code> に相当)。</li><li>Audience が <code>lab-saml-sp</code> → 宛先は SP の Entity ID (OIDC の <code>aud</code> / <code>client_id</code> に相当)。</li><li><code>SignatureValue</code> がある → 署名つき XML。SP は IdP の公開鍵 (descriptor に載る) で検証する (OIDC の JWKS に相当)。</li><li>NameID → ユーザーの識別子 (OIDC の <code>sub</code> に相当)。</li><li>何も届かない → Master SAML Processing URL や Valid redirect URIs の設定、<code>nc</code> の起動順を確認する。</li></ul><p>SP-initiated (SP が AuthnRequest を送る) は、アプリ側に SAML ライブラリが必要なのでここでは扱わない。</p></div></div>`,
        oxIds: [] },
      { id: 'c09-l05-p02', title: `Identity Brokering: 別の IdP (別 Realm) でログインして demo のトークンを受け取る`,
        html: `<p class="goal">やりたいこと: Identity Brokering は、Keycloak が外部の IdP (Google や他の Keycloak) にログインを任せる仕組み。アプリは Keycloak としか話さず、外部のトークンはアプリに届かない。ここでは同じ Keycloak 内の別 Realm (<code>upstream</code>) を「外部 IdP」に見立てて、実際に通す。</p><div class="step"><h4>手順 1　upstream realm に IdP 役を作る</h4><p>前提: SPA (第7章 l01 p01 で作った <code>~/develop/kc-handson/spa/index.html</code> を <code>cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000</code> で配信している) が <code>:3000</code> で動いている。<code>frontend-spa</code> が設定済み。</p><p>先に、管理コンソール (realm <code>demo</code>) の「Users」で <code>carol</code> がまだ存在しないことを確認する (あれば削除する)。管理コンソールの「Sessions」で「Action」→「Sign out all active sessions」→「Confirm」を押して SSO セッションを空にしてから始める (残っているとログイン画面が出ずに戻る)。</p><p>管理コンソールで realm <code>upstream</code> を作る (Create realm)。<code>upstream</code> に User <code>carol</code> (Email <code>carol@example.com</code>、First name <code>Carol</code>、Last name <code>Example</code>、Email verified On) を作り、パスワード <code>carol</code> (Temporary Off) を設定する。<code>upstream</code> で「Clients」→「Create client」: Client ID = <code>demo-broker</code>、Client authentication = <code>On</code>、Standard flow にチェック。Valid redirect URIs = <code>http://localhost:8080/realms/demo/broker/upstream/endpoint</code> で「Save」を押す。<code>demo-broker</code> の「Credentials」タブで Client secret を控える。</p><div class="check"><b>確認</b><pre class="out">upstream に carol と demo-broker がある。</pre></div><div class="read"><b>読み方</b><p>ここまでが「外部 IdP」側の準備。</p></div></div><div class="step"><h4>手順 2　demo に Identity provider を追加する</h4><p>realm を <code>demo</code> に戻し、左メニュー「Identity providers」→「Keycloak OpenID Connect」を選ぶ。Alias = <code>upstream</code>、Use discovery endpoint の欄に <code>http://localhost:8080/realms/upstream/.well-known/openid-configuration</code>、Client authentication = <code>Client secret sent as post</code>、Client ID = <code>demo-broker</code>、Client Secret = 控えた値を入力して「Add」を押す。</p><div class="check"><b>確認</b><pre class="out">画面上部の Redirect URI が、demo-broker に登録した URL と同じ。</pre></div><div class="read"><b>読み方</b><p>違うなら upstream 側で「Invalid parameter: redirect_uri」になるので、<code>demo-broker</code> の Valid redirect URIs を合わせる。</p></div></div><div class="step"><h4>手順 3　upstream 経由でログインする</h4><p>シークレットウィンドウで SPA (<code>http://localhost:3000/</code>) を開いて「login」を押し、ログイン画面の下にある <code>upstream</code> のボタンを押す。<code>carol</code> / <code>carol</code> で upstream にログインし、必要なら「Update Account Information」等の画面を完了する。</p><div class="check"><b>確認</b><pre class="out">## 3. id_token
{ "iss": "http://localhost:8080/realms/demo", "aud": "frontend-spa", "preferred_username": "carol", "email": "carol@example.com", … }</pre></div><div class="read"><b>読み方</b><p>SPA の画面で ID トークンの <code>iss</code> / <code>preferred_username</code> を読み、管理コンソール (realm <code>demo</code>) の「Users」に、先に確認した時は無かった <code>carol</code> が増え、「Identity provider links」タブに <code>upstream</code> があることも見る。</p><p><code>iss</code> が <code>realms/demo</code> (upstream ではない) なので、アプリが受け取ったのは demo realm の Keycloak が新たに発行したトークン。upstream のトークンは Keycloak 内で完結し、アプリは Keycloak しか知らなくてよい。demo に carol が自動作成され <code>upstream</code> とリンクされたのは First Login Flow による。外部 IdP のユーザーは Keycloak 側にも「実体」を持つ。Identity provider を追加するとログイン画面に選択肢が増える。</p><ul><li>upstream への遷移で接続エラー → Keycloak コンテナから <code>http://localhost:8080</code> (自分自身) に Discovery を取りに行けているか確認する。</li><li>Google 等でも同じ構造 (Identity Provider の種類と Client ID/Secret が変わるだけ)。Identity Provider Mapper で外部の属性を Keycloak のユーザー属性に写せる。</li></ul></div></div>`,
        oxIds: [] },
    ] },
  ],
  ox: [], mc: [],
});
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
// 第11章 ユーザー・ロール・グループ (ハンズオン形式)
DATA.chapters.push({
  no: 11, title: `ユーザー・ロール・グループ`,
  lessons: [
    { id: 'c11-l01', title: `User と Role`, pages: [
      { id: 'c11-l01-p01', title: `User を作ってプロフィール項目を確かめる`,
        html: `<p class="goal">やりたいこと: User の基本項目がトークンのどの claim になるかを確かめる。この章では新しいユーザー carol を使う。</p><div class="step"><h4>手順 1　補助関数を定義する</h4><p>前提: 第10章で <code>frontend-spa</code> の Direct access grants を ON にしてある。ターミナルに補助関数を定義する(第10章で定義済みならそのまま)。</p><pre>get_token() { curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password \\
  -d username=$1 -d password=$2 -d scope="openid $3" | jq -r .access_token; }
jwtd() { cut -d. -f2 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .; }</pre><pre>type get_token jwtd</pre><div class="check"><b>確認</b><pre class="out">両方が関数として表示される。</pre></div><div class="read"><b>読み方</b><p>表示された → 準備完了。</p></div></div><div class="step"><h4>手順 2　carol を作る</h4><p>管理コンソールで realm <code>demo</code> → Users → Create new user(<code>Add user</code> の場合もある)。Username=<code>carol</code>、Email=<code>carol@example.com</code>、First name=<code>Carol</code>、Last name=<code>Kato</code>、Email verified=ON → Create。Credentials タブ → Set password でパスワード=<code>carol</code>、Temporary=OFF → Save → Save password。</p><div class="check"><b>確認</b><pre class="out">Users 一覧に carol が出て、Credentials タブに Password が 1 件ある。</pre></div><div class="read"><b>読み方</b><p>Temporary を ON のまま → 初回ログインで変更を求められて curl が失敗する。</p></div></div><div class="step"><h4>手順 3　Attributes を追加する</h4><p>Realm settings の General で Unmanaged Attributes(User Profile に定義していない属性)を管理者が編集できる設定にして Save する(表記が異なる場合は近い項目を探す)。Users → <code>carol</code> に出る Attributes タブで、Key=<code>department</code>、Value=<code>sales</code> を追加して Save。</p><div class="check"><b>確認</b><pre class="out">Attributes タブに department = sales が残る</pre></div><div class="read"><b>読み方</b><p>User の各タブ(Details / Attributes / Credentials / Role mapping / Groups / Consents / Identity provider links / Sessions)も開いて、見られる内容を確認する。</p><p>Attributes は User に保存されただけの値 → トークンへの出方は次の操作で見る。</p></div></div><div class="step"><h4>手順 4　トークンの claim を見る</h4><p>carol でトークンを取る。</p><pre>TOKEN=$(get_token carol carol)
echo $TOKEN | jwtd | jq '{preferred_username, email, email_verified, given_name, family_name, sub}'</pre><div class="check"><b>確認</b><pre class="out">{
  "preferred_username": "carol",
  "email": "carol@example.com",
  "email_verified": true,
  "given_name": "Carol",
  "family_name": "Kato",
  "sub": "(Users 画面の ID と同じ UUID)"
}</pre></div><div class="read"><b>読み方</b><ul><li>Username・Email・First/Last name がそのまま標準 claim → <code>sub</code> が Users 画面の ID と一致するので、ユーザーを一意に識別するのは Username ではなく ID(Username は変えられる)。</li><li><code>department</code> がトークンに出ない → Attributes は User Attribute Mapper を作って初めて claim になる(第4章)。</li><li>Email verified を OFF にして取り直すと <code>email_verified</code> が <code>false</code> → Enabled を OFF にするとログイン自体が <code>invalid_grant</code> で失敗する。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c11-l01-p02', title: `Realm Role と Client Role を付けてトークンで見分ける`,
        html: `<p class="goal">やりたいこと: Realm Role と Client Role を付け、トークンの別々の場所に載ることを確かめる。</p><div class="step"><h4>手順 1　ロールを作る</h4><p>Realm roles に <code>user</code>・<code>admin</code> が無ければ Create role で作る。Clients → <code>api-service</code>(第10章で作成。無ければ Client authentication=ON、フロー全部 OFF で作る)→ Roles タブ → Create role で <code>read</code> と <code>write</code> を作る。</p><div class="check"><b>確認</b><pre class="out">Realm roles に user・admin、api-service の Roles に read・write が並ぶ。</pre></div><div class="read"><b>読み方</b><p>ロールの置き場所が別(realm と Client) → これが Realm Role(realm 全体で使う)と Client Role(特定の Client 専用)の違い。</p></div></div><div class="step"><h4>手順 2　carol に両方を付ける</h4><p>Users → <code>carol</code> → Role mapping タブ → Assign role で Realm role の <code>user</code> を付ける。もう一度 Assign role でフィルタを Filter by clients に切り替え、<code>api-service</code> の <code>read</code> を付ける。トークンを取り直す(古いトークンは変わらない)。</p><pre>TOKEN=$(get_token carol carol)
echo $TOKEN | jwtd | jq '{aud, realm_access, resource_access}'</pre><div class="check"><b>確認</b><pre class="out">{
  "aud": [ "api-service", "account" ],
  "realm_access": { "roles": [ "default-roles-demo", "user", "offline_access", "uma_authorization" ] },
  "resource_access": {
    "api-service": { "roles": [ "read" ] },
    "account": { "roles": [ ... ] }
  }
}</pre></div><div class="read"><b>読み方</b><ul><li>Realm Role は <code>realm_access.roles</code>、Client Role は <code>resource_access.&lt;client_id&gt;.roles</code> → 載っている場所で種類が分かる。</li><li><code>aud</code> に <code>api-service</code> が増える → Client Role を持つクライアントが自動で <code>aud</code> に加わる(Audience Resolve)。</li><li>Client Role は client_id の下にまとまる → 別アプリで同じ名前(<code>read</code> など)を使っても衝突しない。アプリ内の権限は Client Role、組織横断の区分は Realm Role、が基本。</li><li>付けたのに載らない → トークンを取り直したか、次々ページの Full scope allowed を確認する。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c11-l01-p03', title: `Composite Role と Default Roles を作って確かめる`,
        html: `<p class="goal">やりたいこと: Composite Role (ロールを束ねたロール) と Default Roles (新規ユーザーに自動で付くロール) が、どちらもトークンに展開されて載ることを確かめる。</p><div class="step"><h4>手順 1　Composite Role を作って付ける</h4><p>Realm roles → Create role で <code>manager</code> を作る。画面右上 Action → Associate role(または Associated roles タブ → Assign role)で、Realm role <code>user</code> と Client role <code>api-service</code> の <code>write</code> を追加する。Users → <code>carol</code> → Role mapping で <code>manager</code> を Assign role し、トークンを取る。</p><pre>TOKEN=$(get_token carol carol)
echo $TOKEN | jwtd | jq '{realm: .realm_access.roles, api: .resource_access["api-service"].roles}'</pre><div class="check"><b>確認</b><pre class="out">{
  "realm": [ "default-roles-demo", "user", "manager", "offline_access", "uma_authorization" ],
  "api": [ "read", "write" ]
}</pre></div><div class="read"><b>読み方</b><p><code>manager</code> を付けただけで <code>write</code> が出る → Composite Role は中身のロールがトークンに展開される。API 側は <code>manager</code> ではなく <code>write</code> で判定できる。</p></div></div><div class="step"><h4>手順 2　Default Roles を見る</h4><p>Realm settings の中から Default roles を探して開く(User registration 関連のタブにある。表記が異なる場合は近い項目を探す)。新しいユーザー <code>dave</code>(Username だけ入力)を Users の作成画面で作り、Role mapping タブで「Hide inherited roles」のチェックを外して継承分も表示する。</p><div class="check"><b>確認</b><pre class="out">dave に default-roles-demo が最初から付いている。</pre></div><div class="read"><b>読み方</b><ul><li>何もしていないのに付いている → 新規ユーザーには Default Roles が自動付与される。</li><li>チェックを外すと <code>offline_access</code> などが見える → Default Roles 自体が Composite Role。Default roles に足すのは全ユーザーに影響する設計判断なので、全員に与えてよい権限かを先に考える。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c11-l01-p04', title: `ロールがトークンに載らないとき (Full scope allowed)`,
        html: `<p class="goal">やりたいこと: ロールを付けたのにトークンに出ないとき、Client の scope で許可されているかを Full scope allowed の切り替えで確かめる。</p><div class="step"><h4>手順 1　Evaluate で現状を見る</h4><p>Clients → <code>frontend-spa</code> → Client scopes タブ → Evaluate サブタブを開く。Users に <code>carol</code> を入力して選び、Generated access token を開く(ログイン不要でトークン内容を確認できる)。</p><div class="check"><b>確認</b><pre class="out">realm_access と resource_access に carol のロールが出ている。</pre></div><div class="read"><b>読み方</b><p>ロールが全部載る → Full scope allowed が ON の標準状態では、付けたロールがすべて載る。</p></div></div><div class="step"><h4>手順 2　Full scope allowed を OFF にする</h4><p><code>frontend-spa-dedicated</code> → Scope タブで Full scope allowed を OFF にし、もう一度 Evaluate → Generated access token を見る。</p><div class="check"><b>確認</b><pre class="out">(OFF にした直後) realm_access / resource_access から、carol のロールが消える(実機では realm_access が null になる)</pre></div><div class="read"><b>読み方</b><p>ロールが消えた → ユーザーが持つロールのうち、Client の Scope で許可されたものだけがトークンに載る。</p></div></div><div class="step"><h4>手順 3　必要なロールだけ許可する</h4><p>同じ Scope タブの Assign role で、<code>api-service</code> の <code>read</code> だけを許可し、Evaluate をもう一度見る。確認後は Full scope allowed を ON に戻す。</p><div class="check"><b>確認</b><pre class="out">(read だけ許可後) "resource_access": { "api-service": { "roles": [ "read" ] } }</pre></div><div class="read"><b>読み方</b><ul><li>許可した <code>read</code> だけが載る → 「ロール付与」と「トークンに載せる許可」は別の設定。</li><li>載らないとき → (1) 本人にロールが付いているか、(2) Full scope allowed か Scope タブで許可されているか、(3) トークンを取り直したか、の順に見る。Evaluate は設定変更のたびにすぐ確認できる。</li></ul></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c11-l02', title: `Group・Service Account・Required Actions・Organizations・ロール設計指針`, pages: [
      { id: 'c11-l02-p01', title: `Group を作ってロールを継承させ、トークンに出す`,
        html: `<p class="goal">やりたいこと: Group に付けたロールがメンバー全員に継承されることを体験し、Group をトークンに載せる方法も確認する。</p><div class="step"><h4>手順 1　Group にロールを付けてメンバーを入れる</h4><p>Groups → Create group で Name=<code>sales</code> → Create。<code>sales</code> の Role mapping タブ → Assign role で Realm role <code>admin</code> を付け、Members タブ → Add member で <code>bob</code> を追加する(Users → <code>bob</code> → Groups → Join group でも可)。bob に直接ロールは付けない。トークンを取る。</p><pre>TOKEN=$(get_token bob bob)
echo $TOKEN | jwtd | jq '.realm_access.roles'</pre><div class="check"><b>確認</b><pre class="out">[ "default-roles-demo", "admin", "offline_access", "uma_authorization" ]</pre></div><div class="read"><b>読み方</b><p>直接付けていないのに <code>admin</code> が出る → Group に付けたロールはメンバーに継承される(所属は Group、権限は Role)。</p></div></div><div class="step"><h4>手順 2　Mapper を作る前に groups が無いことを確認する</h4><p>先に、Group Membership Mapper を作る前のトークンに <code>groups</code> が出ないことを見る。</p><pre>TOKEN=$(get_token bob bob)
echo $TOKEN | jwtd | jq '{groups}'</pre><div class="check"><b>確認</b><pre class="out">{ "groups": null }</pre></div><div class="read"><b>読み方</b><p><code>groups</code> が <code>null</code> → Group に入っていても、Mapper が無ければトークンには載らない。</p></div></div><div class="step"><h4>手順 3　Group をトークンに載せる</h4><p>Clients → <code>frontend-spa</code> → Client scopes → <code>frontend-spa-dedicated</code> → Configure a new mapper → Group Membership。Name=<code>groups</code>、Token Claim Name=<code>groups</code>、Full group path=OFF、Add to access token=ON → Save。トークンを取り直す。</p><pre>TOKEN=$(get_token bob bob)
echo $TOKEN | jwtd | jq '{groups, roles: .realm_access.roles}'</pre><div class="check"><b>確認</b><pre class="out">{ "groups": [ "sales" ], "roles": [ ... "admin" ... ] }</pre></div><div class="read"><b>読み方</b><ul><li>さっき確認した Mapper を作る前は <code>groups</code> が <code>null</code> で、作ったあとで出る → Group は自動ではトークンに載らず、Group Membership Mapper が必要。</li><li>Full group path を ON にすると <code>/sales</code> のようにパスが付く → サブグループがあるときに区別しやすい。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c11-l02-p02', title: `Service Account (batch-job) を作って確かめる`,
        html: `<p class="goal">やりたいこと: Client Credentials Flow でトークンを取り、Keycloak が Client ごとに自動作成する内部ユーザー (Service Account) へのロールの付け方を確認する。</p><div class="step"><h4>手順 1　batch-job を作ってトークンを取る</h4><p>Clients → Create client で Client ID=<code>batch-job</code>。Capability config で Client authentication=ON、Service accounts roles=ON、Standard flow=OFF → Save。Credentials タブで Client secret をコピーして変数に入れ、トークンを取って中身を見る。</p><pre>BATCH_SECRET='ここに貼る'
curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | tee /tmp/batch.json | jq 'keys'
jq -r .access_token /tmp/batch.json | jwtd | jq '{preferred_username, azp, realm_access}'</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "not-before-policy", "refresh_expires_in", "scope", "token_type" ]
{ "preferred_username": "service-account-batch-job", "azp": "batch-job", "realm_access": { "roles": [ ... ] } }</pre></div><div class="read"><b>読み方</b><ul><li><code>refresh_token</code> と <code>id_token</code> が無く <code>access_token</code> だけ → ユーザーのログインを伴わないため。</li><li><code>preferred_username</code> が <code>service-account-batch-job</code> → 持ち主は人ではなく、Keycloak が Client ごとに自動作成する内部ユーザー(Service Account)。</li><li>Client authentication=OFF の <code>frontend-spa</code> で同じことをすると <code>unauthorized_client</code> → secret を持てる Confidential client が必要。</li></ul></div></div><div class="step"><h4>手順 2　付与前のロールを確認する</h4><p>先に、ロールを付ける前の <code>realm_access</code> を見る。</p><pre>jq -r .access_token /tmp/batch.json | jwtd | jq '.realm_access.roles'</pre><div class="check"><b>確認</b><pre class="out">[ ... ]  (user は含まれない)</pre></div><div class="read"><b>読み方</b><p>この一覧に <code>user</code> が無いことを覚えておく。次の手順で付ける。</p></div></div><div class="step"><h4>手順 3　Service Account にロールを付ける</h4><p>Users で <code>service-account-batch-job</code> を検索して存在を確認する。Clients → <code>batch-job</code> → Service accounts roles タブ → Assign role で Realm role <code>user</code> を付け、トークンを取り直して <code>realm_access</code> を見る。</p><div class="check"><b>確認</b><pre class="out">さっき確認した付与前の一覧に対し、realm_access.roles に user が増える。</pre></div><div class="read"><b>読み方</b><p>付与前に無かった <code>user</code> が増えた → Service Account のロールは、この内部ユーザー(Service accounts roles タブ)に付ける。</p></div></div>`,
        oxIds: [] },
      { id: 'c11-l02-p03', title: `Required Actions を Mailpit で確かめる`,
        html: `<p class="goal">やりたいこと: 次回ログイン時に必ずやらせる作業 (Required Action) を付け、メール確認を Mailpit で受信して動作を確かめる。</p><div class="step"><h4>手順 1　Mailpit を追加して起動する</h4><p>開発用の偽 SMTP サーバー Mailpit(送られたメールを画面で見られる)を、<code>~/develop/kc-handson/docker-compose.yml</code> の <code>services:</code> の下に追記する(<code>keycloak:</code> などと同じインデントにそろえる)。</p><pre>  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "8025:8025"</pre><pre>cd ~/develop/kc-handson
docker compose up -d
docker compose ps</pre><div class="check"><b>確認</b><pre class="out">docker compose ps に mailpit が出て、http://localhost:8025 に空の受信箱が出る。</pre></div><div class="read"><b>読み方</b><p>追加したサービスだけが起動する → 出ないときはインデントと <code>docker compose ps</code> の状態を見る。</p></div></div><div class="step"><h4>手順 2　realm のメール設定をする</h4><p>管理コンソールの Realm settings → Email タブで、Host=<code>mailpit</code>、Port=<code>1025</code>、From=<code>noreply@example.com</code> を入力する。暗号化・認証は OFF のまま Save する。</p><div class="check"><b>確認</b><pre class="out">Save が成功する。</pre></div><div class="read"><b>読み方</b><p>Host は compose 内のサービス名 <code>mailpit</code> → <code>localhost</code> にすると Keycloak コンテナ自身を指してメールが届かない。</p></div></div><div class="step"><h4>手順 3　Required actions を付けてログインする</h4><p>Users → <code>bob</code> → Details で(Email verified が ON なら OFF にしてもよい)Required user actions に <code>Update Password</code> と <code>Verify Email</code> を選び Save。シークレットウィンドウで http://localhost:8080/realms/demo/account を開き、<code>bob</code> / <code>bob</code> でログインして、パスワード変更とメール確認の画面を順に進める。</p><div class="check"><b>確認</b><pre class="out">ログイン直後に画面が割り込み、完了するまでアプリへ進めない。</pre></div><div class="read"><b>読み方</b><ul><li>ログインの途中に画面が挟まる → これが Required Action(次回ログイン時に必ずやらせる作業)。</li><li>残したまま Direct Grant など画面の無い経路でログインすると <code>Account is not fully set up</code> で止まる → Users 画面で Required user actions を確認する(Username / Email / 氏名が必須設定なのに空、のときも同じ表示なので Email・氏名も確認する)。</li></ul></div></div><div class="step"><h4>手順 4　メールのリンクで確認を完了する</h4><p>Mailpit(http://localhost:8025)を開き、届いたメールの本文のリンクをクリックする。最後に Authentication の中の Required actions(表記が異なる場合は近い項目を探す)で、利用できる Required Action(Update Password / Verify Email / Configure OTP など)と Enabled / Set as default action のスイッチを見る。</p><div class="check"><b>確認</b><pre class="out">Mailpit の受信箱: 宛先 bob@example.com、件名に「Verify email」相当のメールが 1 通
リンクをクリック → 「Your email address has been verified」相当の表示
管理コンソール Users → bob: Email verified = ON、Required user actions が空</pre></div><div class="read"><b>読み方</b><p>メールが届いた → realm のメール設定が正しい。届かないときは Email タブの Host(<code>mailpit</code>)と Port(<code>1025</code>)、<code>mailpit</code> の起動状態を見る。</p></div></div>`,
        oxIds: [] },
      { id: 'c11-l02-p04', title: `Organizations を有効にしてメンバーを作る`,
        html: `<p class="goal">やりたいこと: Organizations (Keycloak 26) で組織を作り、ユーザーを所属させ、トークンに組織情報が出るところまで確認する。</p><div class="step"><h4>手順 1　有効化して組織を作る</h4><p>Realm settings の General で Organizations を有効にして Save する(表記が異なる場合は近い項目を探す)。Organizations → Create organization で Name=<code>Acme</code>、Alias=<code>acme</code>、Domain=<code>example.com</code> → Save。</p><div class="check"><b>確認</b><pre class="out">左メニューに Organizations が現れ、一覧に Acme が出る。</pre></div><div class="read"><b>読み方</b><ul><li>左メニューに Organizations が無い → 有効化が反映されていない。</li><li>Organizations(Keycloak 26) → B2B 向けに顧客企業(組織)ごとにユーザーをまとめる機能。</li></ul></div></div><div class="step"><h4>手順 2　メンバーを追加して claim を見る</h4><p>組織の Members タブ → Add member で既存ユーザー <code>alice</code> を追加する。Clients → <code>frontend-spa</code> → Client scopes タブに組織用のスコープ(<code>organization</code> など)があれば Optional で追加し、<code>scope</code> に書いて要求する(無い場合は、組織とメンバーを作るところまでで先へ進んでよい)。</p><pre>TOKEN=$(get_token alice alice organization)
echo $TOKEN | jwtd | jq '{scope, organization}'</pre><div class="check"><b>確認</b><pre class="out">{
  "scope": "openid organization ...",
  "organization": (acme に関する値)
}</pre></div><div class="read"><b>読み方</b><ul><li><code>organization</code> claim に <code>acme</code> に関する値が出る → ユーザーの所属組織をトークンで API に伝えられる。</li><li>出ない → (1) ユーザーが組織のメンバーか、(2) <code>organization</code> スコープを Client に割り当て、<code>scope=</code> に書いたか(Optional Scope は書かないと載らない)、(3) トークンを取り直したか、の順に見る。</li><li>組織のログイン元 IdP(Identity Providers タブ)を組み合わせる → ドメインごとに外部 IdP へ振り分けられる(ここでは組織とメンバーまでで十分)。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c11-l02-p05', title: `ロール設計をまとめて確認する`,
        html: `<p class="goal">やりたいこと: Client Role・Composite Role・Group を組み合わせた設計が、トークンでどう見えるかを Evaluate で一覧する。</p><div class="step"><h4>手順 1　carol と bob を見比べる</h4><p>Clients → <code>frontend-spa</code> → Client scopes タブ → Evaluate で、Users=<code>carol</code> の Generated access token の <code>realm_access</code> / <code>resource_access</code> / <code>aud</code> をメモし、Users=<code>bob</code> に変えて見比べる。Clients → <code>api-service</code> → Roles タブで API 用の Client Role(<code>read</code> / <code>write</code>)も確認する。</p><div class="check"><b>確認</b><pre class="out">carol: resource_access.api-service.roles = [ read, write ]、realm_access に user, manager
bob  : realm_access に admin(Group 由来)</pre></div><div class="read"><b>読み方</b><ul><li>API が見るのは <code>resource_access.api-service.roles</code> の <code>read</code> / <code>write</code> → Composite Role <code>manager</code> がそこへ展開されているので、API 側は職務名を知らなくてよい。</li><li>指針 → API ごとに Client Role、人の所属は Group、職務は Composite Role。</li></ul></div></div><div class="step"><h4>手順 2　Group への参加でロールが増えるのを見る</h4><p>carol を Group <code>sales</code> に参加させ(Users → carol → Groups → Join group)、Evaluate をもう一度開く。</p><div class="check"><b>確認</b><pre class="out">carol を sales に参加後: realm_access に admin も加わる</pre></div><div class="read"><b>読み方</b><ul><li>Group に参加しただけで <code>admin</code> が増える → 権限の管理は Group 単位で一括にでき、人の異動は Group の付け替えだけで済む。</li><li>全ユーザーに直接ロールを付ける → 管理不能になる。Role は権限の種類、Group は所属、Composite は職務のまとめ、と覚える。</li></ul></div></div><div class="step"><h4>手順 3　後片付けをする</h4><p>carol と bob を Group <code>sales</code> から外す(Groups → sales → Members で選んで Leave)。</p><div class="check"><b>確認</b><pre class="out">sales の Members が空になる。</pre></div><div class="read"><b>読み方</b><p>外しておく → 後の章(第12・16章)は carol・bob に <code>admin</code> が無い前提で進む。</p></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
// 第12章 認証フロー(Authentication Flows) (ハンズオン形式)
DATA.chapters.push({
  no: 12, title: `認証フロー(Authentication Flows)`,
  lessons: [
    { id: 'c12-l01', title: `Flow の構成要素・標準フロー・Execution`, pages: [
      { id: 'c12-l01-p01', title: `標準の browser フローを開いて SSO Cookie を体験する`,
        html: `<p class="goal">やりたいこと: 標準の browser フローの中身を見て、Cookie による画面なしログイン (SSO) を起こす。</p><div class="step"><h4>手順 1　標準フローの中身を読む</h4><p>管理コンソールで realm <code>demo</code> → Authentication → Flows タブを開く。標準フロー(<code>browser</code>、<code>direct grant</code>、<code>registration</code>、<code>reset credentials</code>、<code>first broker login</code> など)を確認し、<code>browser</code> を開く。</p><div class="check"><b>確認</b><pre class="out">Cookie / Identity Provider Redirector / forms (中に Username Password Form) などが上から順に並ぶ</pre></div><div class="read"><b>読み方</b><p>Execution と Requirement(Required / Alternative / Conditional / Disabled)が上から順に並ぶ。</p><ul><li>Authentication Flow → ログイン時に「どの確認をどの順番でやるか」の手順書(OAuth の Flow とは別物)。上から順に処理される。</li><li>Required は必ず成功が必要、Alternative は候補のうち 1 つ成功すればよい、Conditional は条件を満たしたときだけ実行、Disabled は無効。</li></ul></div></div><div class="step"><h4>手順 2　2 回アクセスして SSO を体験する</h4><p>シークレットウィンドウ(SSO の Cookie が無い状態)で http://localhost:8080/realms/demo/account を開き、Sign in → <code>alice</code> / <code>alice</code> でログインする。同じシークレットウィンドウの別タブで、もう一度同じ URL を開く。管理コンソールの左メニュー Sessions も見る。</p><div class="check"><b>確認</b><pre class="out">1回目: ログイン画面が出て、ID/パスワードを入力
2回目: ログイン画面は出ず、そのままアカウント画面が開く
Sessions: alice のセッションが 1 件</pre></div><div class="read"><b>読み方</b><ul><li>2 回目に入力なしで入れた → <code>Cookie</code> の Execution が SSO セッションを見つけて残りの手順を飛ばした。</li><li>Cookie が成功すると <code>forms</code> は実行されない → Alternative は 1 つ成功すればよいから。アプリから見た違いは、ログイン画面や追加確認画面が出るか出ないかという形で現れる。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c12-l01-p02', title: `browser フローを複製して Cookie を無効にする`,
        html: `<p class="goal">やりたいこと: 標準フローは複製したコピーを編集して Bind flow で適用し、Cookie を無効にして SSO がきかなくなることを確認する。</p><div class="step"><h4>手順 1　複製して Bind する</h4><p>標準フローは直接編集せず、Duplicate したコピーを編集して Bind flow で適用するのが基本。Authentication → Flows → <code>browser</code> の操作メニュー(またはフロー画面右上の Action)から Duplicate。Name=<code>browser-lab</code> → Duplicate。続いて <code>browser-lab</code> の Action → Bind flow → Binding type=<code>Browser flow</code> → Save。</p><div class="check"><b>確認</b><pre class="out">Flows 一覧で browser-lab が Browser flow として使われている。</pre></div><div class="read"><b>読み方</b><p>Bind した → 以後、realm のブラウザログインはこのフローで動く。標準の <code>browser</code> は残っているので、いつでも Bind し直して戻せる。</p></div></div><div class="step"><h4>手順 2　Cookie を Disabled にして試す</h4><p><code>browser-lab</code> 内の <code>Cookie</code> の Requirement を <code>Disabled</code> に変更する。通常のウィンドウで一度ログアウトしてから http://localhost:8080/realms/demo/account でログインし、続けて別タブで同じ URL をもう一度開く。確認後、<code>Cookie</code> を <code>Alternative</code> に戻す。</p><div class="check"><b>確認</b><pre class="out">Cookie=Disabled: 2回目のアクセスでもログイン画面が出る(毎回入力が必要)
Cookie=Alternative に戻す: 2回目は画面なしで入れる</pre></div><div class="read"><b>読み方</b><ul><li>Disabled で 2 回目もログイン画面 → 画面なしログイン(SSO)は Cookie の Execution が担っていた。フローの 1 行を変えるだけで、ログインの挙動が変わる。</li><li>ログインできなくなった(Username Password Form を誤って Disabled にした等) → 管理コンソールは master realm で動いているので、管理者は demo の設定画面から Bind flow を <code>browser</code> に戻せる。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c12-l01-p03', title: `Registration と Reset credentials を使ってみる`,
        html: `<p class="goal">やりたいこと: Realm の設定でスイッチを入れて登録とパスワード再設定を使い、Mailpit でメールを確認する。</p><div class="step"><h4>手順 1　スイッチを入れてリンクを出す</h4><p>Realm settings の Login タブで User registration と Forgot password を ON にする(表記が異なる場合は近い項目を探す)。Realm settings → Email タブで Host=<code>mailpit</code>、Port=<code>1025</code>、From が設定済み(第11章)であることも確認する。未設定なら、<code>~/develop/kc-handson/docker-compose.yml</code> の <code>services:</code> の下に <code>mailpit:</code>(<code>image: axllent/mailpit:latest</code>、<code>ports:</code> に <code>"8025:8025"</code>)を追記して <code>docker compose up -d</code> で起動し、Realm settings → Email タブで Host=<code>mailpit</code>、Port=<code>1025</code>、From=<code>noreply@example.com</code>(暗号化・認証は OFF)にして Save する。シークレットウィンドウで http://localhost:8080/realms/demo/account を開く。</p><div class="check"><b>確認</b><pre class="out">ログイン画面の下に「Register」「Forgot Password?」のリンク</pre></div><div class="read"><b>読み方</b><p>スイッチを入れた途端にリンクが出る → 画面に出す・出さないは Realm の設定、中の手順は Authentication Flow(Authentication → Flows の registration / reset credentials の Execution)という分担。</p></div></div><div class="step"><h4>手順 2　登録とパスワード再設定を通す</h4><p>Register から新しいユーザー(例 <code>erin</code>)を登録する。ログアウトし、Forgot Password? から <code>erin</code> を入力して送信する。Mailpit(http://localhost:8025)を開き、パスワード再設定のメールのリンクをたどる。</p><div class="check"><b>確認</b><pre class="out">Mailpit: erin 宛のパスワード再設定メールが 1 通</pre></div><div class="read"><b>読み方</b><ul><li>リンクからパスワードを再設定できた → <code>reset credentials</code> フローが動いた。届かないときは Email タブの設定と <code>mailpit</code> コンテナの状態を見る。</li><li>ログイン以外の入口(登録・再設定・外部 IdP 初回ログイン)にも、それぞれ別のフローがある。</li></ul></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c12-l02', title: `認証強化機能・設定例`, pages: [
      { id: 'c12-l02-p01', title: `OTP (MFA) を設定してログインの変化を見る`,
        html: `<p class="goal">やりたいこと: Required Action の Configure OTP から TOTP (6 桁のワンタイムコード) を登録し、ログインがどう変わるかを見る。</p><div class="step"><h4>手順 1　OTP を登録する</h4><p>Authentication → Flows で <code>browser</code> に戻す(<code>browser-lab</code> の Cookie を <code>Alternative</code> に戻してあれば、そのままでもよい)。Users → <code>bob</code> → Details の Required user actions に <code>Configure OTP</code> を選んで Save し、シークレットウィンドウで http://localhost:8080/realms/demo/account を開いて <code>bob</code> / <code>bob</code> でログインする。QR コードの画面が出るので、スマホの認証アプリ(Google Authenticator 等)で読み取る。アプリが無ければ「Unable to scan?」を押して表示されるキーを使い、出た 6 桁コードを入力して登録する。</p><pre># 任意: oathtool がある場合(例: brew install oath-toolkit)
oathtool --totp -b 'ここにキー(スペースなし)'</pre><div class="check"><b>確認</b><pre class="out">1回目: パスワード入力 → OTP 登録画面 → 6桁入力で完了
Credentials タブ: Password に加えて OTP が 1 件</pre></div><div class="read"><b>読み方</b><ul><li>Users → <code>bob</code> → Credentials タブに OTP が出る → 登録できた(TOTP は 6 桁のワンタイムコードによる MFA)。</li><li>コードが何度やっても通らない → 端末の時計のずれが定番の原因(TOTP は時刻で計算する)。</li></ul></div></div><div class="step"><h4>手順 2　登録後のログインを見る</h4><p>一度ログアウトして、もう一度 <code>bob</code> でログインする。</p><div class="check"><b>確認</b><pre class="out">2回目: パスワード入力 → 「One-time code」の入力画面が出る</pre></div><div class="read"><b>読み方</b><ul><li>パスワードのあとに One-time code 画面 → 標準フローの OTP 部分は条件付き(Conditional)で、OTP を登録済みのユーザーにだけ要求される。</li><li>OTP を持たない alice → 今まで通りパスワードだけで入れる。</li><li>OTP を紛失した → 管理者が Users → Credentials で OTP を削除するか、Required user actions に Configure OTP を付け直す。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c12-l02-p02', title: `管理者ロールの人だけ MFA を必須にする`,
        html: `<p class="goal">やりたいこと: admin ロールを持つ人だけ OTP を必須にする条件付きサブフローを組み、carol と alice で挙動を比べる。</p><div class="step"><h4>手順 1　条件付きサブフローを組む</h4><p>Authentication → Flows → <code>browser</code> を Duplicate して <code>browser-admin-otp</code> を作る(<code>browser-lab</code> があれば流用してもよい)。<code>forms</code> サブフローの右の +(Add step)から Add sub-flow で Name=<code>Admin OTP</code> → Add し、Requirement を <code>Conditional</code> にする。<code>Admin OTP</code> の + → Add condition でユーザーのロールを判定する条件(Condition - user role)を追加して Requirement=<code>Required</code>、歯車(Settings)で Alias を付け、対象のロールに <code>admin</code> を指定して Save する(設定項目名は画面の表記に合わせる)。<code>Admin OTP</code> の + → Add step → OTP Form を追加して Requirement=<code>Required</code> にする。</p><div class="check"><b>確認</b><pre class="out">Admin OTP(Conditional)の下に Condition - user role(Required)と OTP Form(Required)が並ぶ。</pre></div><div class="read"><b>読み方</b><p>Conditional の下に条件と OTP Form → 条件を満たしたときだけ中身が実行される構造。これが Authentication Flow をカスタマイズする典型例。</p></div></div><div class="step"><h4>手順 2　Bind して carol と alice で試す</h4><p>Action → Bind flow → <code>Browser flow</code> に設定する。シークレットウィンドウで、<code>carol</code>(admin ロール無し)と <code>alice</code>(第1章で admin ロールを付与済み)で順にログインする。<code>carol</code> での確認が終わったら必ずそのウィンドウを閉じ、新しいシークレットウィンドウで <code>alice</code> を試す(carol の SSO セッションが残っていると alice のログイン画面が出ない)。</p><div class="check"><b>確認</b><pre class="out">carol: パスワードだけでログイン完了
alice: パスワードのあと OTP の登録(または入力)画面が出る</pre></div><div class="read"><b>読み方</b><ul><li>carol はパスワードだけ、alice は OTP 画面 → Condition が admin ロールの有無で OTP Form を実行するか決めている。</li><li>OTP 未登録の alice にいきなり登録画面が出る → OTP Form が Required だと未登録のユーザーには登録まで案内される。</li><li>両方とも OTP を求められた/求められなかった → (1) Condition の User role が <code>admin</code> か、(2) <code>Admin OTP</code> が Conditional か、(3) このフローを Bind したか、(4) ユーザーが実際にロールを持つか(Role mapping)の順に見る。確認が終わったら、<code>browser</code> を Bind し直して元に戻す。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c12-l02-p03', title: `Password Policy で弱いパスワードを弾く`,
        html: `<p class="goal">やりたいこと: Password Policy を設定し、規則に反するパスワードが拒否されるのを確認する。</p><div class="step"><h4>手順 1　Policy を追加する</h4><p>Authentication の中から Policies → Password policy を開く(表記が異なる場合は近い項目を探す)。Add policy で <code>Minimum length</code>=<code>4</code> と <code>Not Username</code> を追加し、Save する。</p><div class="check"><b>確認</b><pre class="out">2 つの Policy が一覧に並ぶ。</pre></div><div class="read"><b>読み方</b><p>最小長を 4 にしている → <code>carol</code>(5 文字)で「ユーザー名と同じ」の規則を単独で確かめるため。8 にすると <code>carol</code> は先に最小長で拒否される(規則は 1 つずつ判定され、最初に反した理由が出る)。</p></div></div><div class="step"><h4>手順 2　反するパスワードと通るパスワードを試す</h4><p>Users → <code>carol</code> → Credentials タブ → Reset password で、<code>abc</code>、<code>carol</code>、<code>Carol-2025-pass</code> の順に入れて Save する。</p><div class="check"><b>確認</b><pre class="out">abc            -&gt; エラー: Invalid password: minimum length 4.(最小長に反する)
carol          -&gt; エラー: Invalid password: must not be equal to the username.
Carol-2025-pass -&gt; 保存できる</pre></div><div class="read"><b>読み方</b><ul><li>保存時に拒否された → Password Policy は管理者の操作でもユーザー自身の変更でも、パスワードが変わる場面で働く。</li><li>Policy を足しても設定済みのパスワードは自動では変わらない → 新しい設定に合わせるには Required Action の Update Password でユーザーに変更させる。</li></ul></div></div><div class="step"><h4>手順 3　Policy を元に戻す</h4><p>Password policy から追加した 2 つを削除して Save する。carol のパスワードは後の章で使うので、<code>carol</code> に戻しておくと便利。</p><div class="check"><b>確認</b><pre class="out">Password policy が空になる。</pre></div><div class="read"><b>読み方</b><ul><li>認証を強くする機能 → MFA のほかに Password Policy、Brute force detection(第14章)、Step-up Authentication(重要な操作のときだけ追加認証。<code>acr_values</code> で要求し、<code>acr</code> claim に反映)などがある。</li><li>条件分岐を Flow に組む考え方 → 前ページの「ロールによる OTP」と同じ。</li></ul></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
// 第13章 User Federation(LDAP / AD) (ハンズオン形式)
DATA.chapters.push({
  no: 13, title: `User Federation(LDAP / AD)`,
  lessons: [
    { id: 'c13-l01', title: `User Federation とは・用語・主な設定項目`, pages: [
      { id: 'c13-l01-p01', title: `openldap を追加してデータを入れ、中身を見る`,
        html: `<p class="goal">やりたいこと: <b>User Federation</b> は、社内の名簿(LDAP / Active Directory)を Keycloak につなぎ、既存の ID・パスワードでログインさせる機能。つなぐ前に openldap を compose に追加してデータを投入し、LDAP の用語(DN・Bind DN・Users DN)を実物で押さえる。</p><div class="step"><h4>手順 1　openldap を追加して起動する</h4><p><code>~/develop/kc-handson/docker-compose.yml</code> の <code>services:</code> の下に追記する(Apple Silicon ではエミュレーションで動くので、初回は起動に時間がかかる)。</p><pre>  openldap:
    image: osixia/openldap:1.5.0
    platform: linux/amd64
    environment:
      LDAP_ORGANISATION: Example Org
      LDAP_DOMAIN: example.org
      LDAP_ADMIN_PASSWORD: admin
      LDAP_TLS: "false"
    ports:
      - "389:389"</pre><pre>cd ~/develop/kc-handson
docker compose up -d
docker compose ps</pre><div class="check"><b>確認</b><pre class="out">docker compose ps に openldap が表示される。</pre></div><div class="read"><b>読み方</b><p>起動していなければ <code>docker compose logs openldap</code> を見る。ポート 389 が他で使われていないかも確認する。</p></div></div><div class="step"><h4>手順 2　ユーザーとグループを投入する</h4><p>十数秒待ってから <code>ldapadd</code> で投入する。エントリの間は空行で区切る。</p><pre>docker compose exec -T openldap ldapadd -x -D cn=admin,dc=example,dc=org -w admin &lt;&lt;'LDIF'
dn: ou=people,dc=example,dc=org
objectClass: organizationalUnit
ou: people

dn: ou=groups,dc=example,dc=org
objectClass: organizationalUnit
ou: groups

dn: uid=ldap-taro,ou=people,dc=example,dc=org
objectClass: inetOrgPerson
uid: ldap-taro
cn: Taro Yamada
sn: Yamada
givenName: Taro
mail: taro@example.com
userPassword: taro

dn: uid=ldap-hanako,ou=people,dc=example,dc=org
objectClass: inetOrgPerson
uid: ldap-hanako
cn: Hanako Suzuki
sn: Suzuki
givenName: Hanako
mail: hanako@example.com
userPassword: hanako

dn: cn=developers,ou=groups,dc=example,dc=org
objectClass: groupOfNames
cn: developers
member: uid=ldap-taro,ou=people,dc=example,dc=org
member: uid=ldap-hanako,ou=people,dc=example,dc=org
LDIF</pre><div class="check"><b>確認</b><pre class="out">adding new entry "ou=people,dc=example,dc=org"
...(5 エントリ分)</pre></div><div class="read"><b>読み方</b><p>各エントリについて追加メッセージが出る。</p><p>接続できないなら起動直後で LDAP が未準備なので、少し待って再実行する。2 回目の実行は <code>ldap_add: Already exists (68)</code> になる(データは入っている)。やり直すときは <code>docker compose rm -sfv openldap</code> で削除してから <code>docker compose up -d</code>。</p></div></div><div class="step"><h4>手順 3　検索で中身を見る</h4><p>ホストに <code>ldapsearch</code> が無くても、コンテナ内で実行できる。</p><pre>docker compose exec openldap ldapsearch -x -H ldap://localhost:389 \\
  -D cn=admin,dc=example,dc=org -w admin -b dc=example,dc=org '(objectClass=*)' dn
docker compose exec openldap ldapsearch -x -H ldap://localhost:389 \\
  -D cn=admin,dc=example,dc=org -w admin -b ou=people,dc=example,dc=org uid mail givenName sn</pre><div class="check"><b>確認</b><pre class="out">dn: dc=example,dc=org
dn: ou=people,dc=example,dc=org
dn: ou=groups,dc=example,dc=org
dn: uid=ldap-taro,ou=people,dc=example,dc=org
dn: uid=ldap-hanako,ou=people,dc=example,dc=org
dn: cn=developers,ou=groups,dc=example,dc=org
...
uid: ldap-taro
mail: taro@example.com
givenName: Taro
sn: Yamada</pre></div><div class="read"><b>読み方</b><p>1 つ目は DN の一覧、2 つ目はユーザーの属性が出る。</p><ul><li><code>dn</code> は LDAP 上の住所(階層)。<code>ou=people,dc=example,dc=org</code> が Keycloak の <b>Users DN</b> になる。</li><li><code>-D cn=admin,dc=example,dc=org -w admin</code> は検索のための管理用アカウントで、Keycloak の <b>Bind DN / Bind credentials</b> に当たる。</li><li><code>uid</code>・<code>mail</code>・<code>givenName</code>・<code>sn</code> は LDAP の属性名。次ページ以降で Keycloak の username・email・First name・Last name にどう対応づけるか(LDAP Mapper)を見る。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c13-l01-p02', title: `openldap を User Federation に登録する`,
        html: `<p class="goal">やりたいこと: realm <code>demo</code> に LDAP を登録する。ログイン時に Keycloak が LDAP に「このパスワードで合っているか」を問い合わせる構成になる。</p><div class="step"><h4>手順 1　LDAP provider を追加する</h4><p>管理コンソールで realm <code>demo</code> → 左メニュー <b>User federation</b> → <b>Add LDAP providers</b>(または Add new provider → ldap)を選び、次のように入力する。</p><ul><li>UI display name=<code>openldap</code></li><li>Vendor=<code>Other</code></li><li>Connection URL=<code>ldap://openldap:389</code>(Keycloak コンテナから見た名前。ホストの <code>localhost</code> ではない)</li><li>Bind type=<code>simple</code>、Bind DN=<code>cn=admin,dc=example,dc=org</code>、Bind credentials=<code>admin</code></li><li>Edit mode=<code>READ_ONLY</code></li><li>Users DN=<code>ou=people,dc=example,dc=org</code></li><li>Username LDAP attribute=<code>uid</code>、RDN LDAP attribute=<code>uid</code>、UUID LDAP attribute=<code>entryUUID</code></li><li>User object classes=<code>inetOrgPerson, organizationalPerson</code>、Search scope=<code>One Level</code></li></ul><div class="check"><b>確認</b><pre class="out">Test connection: Successfully connected to LDAP
Test authentication: Successfully connected to LDAP</pre></div><div class="read"><b>読み方</b><p><b>Test connection</b> と <b>Test authentication</b> を押す。</p><p>Test connection が成功すれば、Keycloak コンテナから <code>openldap:389</code> に届いている。失敗なら URL を見る(<code>ldap://localhost:389</code> にしていないか。コンテナ内の <code>localhost</code> は Keycloak 自身を指す)。Test authentication が失敗なら Bind DN か Bind credentials の誤り。</p></div></div><div class="step"><h4>手順 2　同期設定を確認して保存する</h4><p>Synchronization settings の <b>Import users</b> が ON(既定)であることを確認し、Save する。</p><div class="check"><b>確認</b><pre class="out">User federation 一覧に「openldap」が表示される。</pre></div><div class="read"><b>読み方</b><ul><li><b>Import users</b> が ON だと LDAP ユーザーを Keycloak の DB にコピーして使う。OFF は毎回 LDAP を参照する。</li><li><b>Edit mode</b> は、Keycloak での変更を LDAP に書き戻してよいかの設定。<code>READ_ONLY</code>=読み取りのみ(パスワード変更も不可)、<code>WRITABLE</code>=書き戻す、<code>UNSYNCED</code>=変更は Keycloak 内だけに保存。名簿を壊したくないなら READ_ONLY が安全。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c13-l01-p03', title: `ユーザーを同期して ldap-taro でログインする`,
        html: `<p class="goal">やりたいこと: 登録しただけでは LDAP のユーザーは Keycloak の Users に並ばない(ログインしたときにも取り込まれる)。<b>Sync</b> で取り込み、LDAP のパスワードでログインできること、READ_ONLY の効果を確かめる。</p><div class="step"><h4>手順 1　同期の前の Users を見る</h4><p>Users を開き、検索欄に <code>ldap</code> と入れて検索する。</p><div class="check"><b>確認</b><pre class="out">ldap-taro / ldap-hanako は出ない(No users found 相当)。</pre></div><div class="read"><b>読み方</b><p>登録しただけでは LDAP のユーザーは Users に並んでいない。ここが同期前の基準。</p></div></div><div class="step"><h4>手順 2　ユーザーを同期する</h4><p>User federation → <code>openldap</code> → 右上の Action → <b>Sync all users</b> を実行する。Users を開き、<code>ldap-taro</code> を検索して開く。</p><div class="check"><b>確認</b><pre class="out">Sync の結果: 「2 imported users」のように 2 ユーザーが取り込まれた旨のメッセージ</pre></div><div class="read"><b>読み方</b><p>Sync の結果メッセージと、ユーザー詳細の Federation link を見る。</p><p>手順1では出なかった <code>ldap-taro</code> が出るなら、取り込まれている。出ないときは、Users DN・User object classes が LDAP の実際の値と合っているか、Sync all users を実行したかを見る。</p></div></div><div class="step"><h4>手順 3　LDAP のパスワードでトークンを取る</h4><p><code>frontend-spa</code> の Direct access grants が ON であること。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=ldap-taro -d password=taro -d scope=openid \\
  | jq -r .access_token | cut -d. -f2 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq '{preferred_username, email, given_name, family_name}'</pre><div class="check"><b>確認</b><pre class="out">{ "preferred_username": "ldap-taro", "email": "taro@example.com", "given_name": "Taro Yamada", "family_name": "Yamada" }</pre></div><div class="read"><b>読み方</b><p>payload の主要項目が出る。</p><p>Keycloak 側で作っていない <code>ldap-taro</code> が LDAP のパスワード <code>taro</code> でログインできたなら、Keycloak は LDAP に問い合わせてパスワードを確認している。email や名前が入っているのは、LDAP の <code>mail</code> / <code>sn</code> などが Keycloak の属性に対応づけられているから(次のレッスンの LDAP Mapper)。<code>given_name</code> が「Taro」ではなく「Taro Yamada」なのは、Vendor=Other の <code>first name</code> Mapper が既定で <code>givenName</code> ではなく <code>cn</code> を読むため(Mappers タブで確認できる)。</p></div></div><div class="step"><h4>手順 4　間違ったパスワードで試す</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=ldap-taro -d password=wrong -d scope=openid | jq .</pre><div class="check"><b>確認</b><pre class="out">{ "error": "invalid_grant", "error_description": "Invalid user credentials" }</pre></div><div class="read"><b>読み方</b><p>エラーが返る。</p><p><code>invalid_grant</code> は LDAP 側のパスワード照合が失敗したということ。</p></div></div><div class="step"><h4>手順 5　パスワード変更を試す</h4><p>Users → <code>ldap-taro</code> → Credentials タブで、パスワードの変更(Reset password)を試す。</p><div class="check"><b>確認</b><pre class="out">READ_ONLY のためエラーで保存できない(API で試すと「Can't reset password as account is read only」)。</pre></div><div class="read"><b>読み方</b><p>エラーになるなら READ_ONLY が効いている。Keycloak から LDAP を書き換えたいなら Edit mode を WRITABLE にする判断が必要。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c13-l02', title: `LDAP Mapper・Kerberos・Brokering との違い`, pages: [
      { id: 'c13-l02-p01', title: `LDAP Mapper で属性の対応づけを変えてみる`,
        html: `<p class="goal">やりたいこと: <b>LDAP Mapper</b> は、LDAP の属性を Keycloak のユーザー属性に対応づける部品(例: <code>mail</code> → <code>email</code>)。第4章の Protocol Mapper(トークンに claim を載せる部品)とは別物。対応づけを書き換えて、結果が変わるのを見る。</p><div class="step"><h4>手順 1　Mapper の一覧を見る</h4><p>User federation → <code>openldap</code> → <b>Mappers</b> タブを開き、<code>last name</code> を開く。続けて Users → <code>ldap-taro</code> の Last name も見ておく。</p><div class="check"><b>確認</b><pre class="out">username・email・first name・last name などの Mapper(type は user-attribute-ldap-mapper)が並び、last name の LDAP Attribute が sn である。
Users → ldap-taro の Last name は「Yamada」。</pre></div><div class="read"><b>読み方</b><p><code>user-attribute-ldap-mapper</code> は属性の対応、<code>group-ldap-mapper</code> は LDAP グループ → Keycloak グループ、<code>role-ldap-mapper</code> は LDAP グループ → Keycloak ロール。</p></div></div><div class="step"><h4>手順 2　LDAP Attribute を cn に変えて同期する</h4><p><code>last name</code> の LDAP Attribute を <code>cn</code> に変更して Save する。User federation → <code>openldap</code> → Action → <b>Sync all users</b> を実行し、Users → <code>ldap-taro</code> の Last name を見る。</p><div class="check"><b>確認</b><pre class="out">Last name が「Taro Yamada」(LDAP の cn の値)になる。</pre></div><div class="read"><b>読み方</b><p>属性名を変えただけで値が変わったなら、どの LDAP 属性をどの Keycloak 属性にするかは Mapper が決めている。LDAP 側の属性名が会社ごとに違っても Mapper で合わせられる。変わらないときは、Sync all users を実行したか、ページを開き直したかを確認する(Import users が ON だと Keycloak の DB にコピーされた値を見ている)。</p></div></div><div class="step"><h4>手順 3　sn に戻して同期する</h4><p>LDAP Attribute を <code>sn</code> に戻して Save し、もう一度 Sync all users を実行する。</p><div class="check"><b>確認</b><pre class="out">Last name が「Yamada」に戻る。</pre></div><div class="read"><b>読み方</b><p>戻れば、値は Mapper の設定で決まり、LDAP のデータ自体は変わっていないということ。</p></div></div>`,
        oxIds: [] },
      { id: 'c13-l02-p02', title: `LDAP のグループを Keycloak の Group に取り込む`,
        html: `<p class="goal">やりたいこと: LDAP の <code>developers</code> グループを、<code>group-ldap-mapper</code> で Keycloak の Group として扱い、トークンの <code>groups</code> に載せる。</p><div class="step"><h4>手順 1　group-ldap-mapper を追加する</h4><p>User federation → <code>openldap</code> → Mappers タブ → <b>Add mapper</b>。Name=<code>ldap-groups</code>、Mapper type=<code>group-ldap-mapper</code>。(入力項目名は画面の表記と異なる場合がある。近い項目を探して、次の値を入れる。)</p><ul><li>LDAP Groups DN=<code>ou=groups,dc=example,dc=org</code></li><li>Group Name LDAP Attribute=<code>cn</code></li><li>Group Object Classes=<code>groupOfNames</code></li><li>Membership LDAP Attribute=<code>member</code></li><li>Membership Attribute Type=<code>DN</code></li><li>Mode=<code>READ_ONLY</code>(その他は既定のまま)</li></ul><p>Save する前に、左メニュー Groups を開いて <code>developers</code> がまだ無いことを確認しておく。Save したら、Mapper 画面の Action(右上)から LDAP のグループを Keycloak に同期する操作を実行する(見つからなければ、<code>openldap</code> の Sync all users をもう一度実行する)。</p><div class="check"><b>確認</b><pre class="out">同期前: Groups に developers は無い
同期後: Groups: developers(Members: ldap-taro, ldap-hanako)</pre></div><div class="read"><b>読み方</b><p>さっきは無かった左メニュー Groups に <code>developers</code> が現れ、Members に <code>ldap-taro</code> と <code>ldap-hanako</code> がいる。</p><p><code>developers</code> が出てメンバーに LDAP ユーザーが並ぶなら、LDAP のグループとメンバー関係が Keycloak に反映されている。ここに Role mapping を付ければ、LDAP のグループ単位で権限を管理できる。Sync でエラーになるときは、LDAP Groups DN と Group Object Classes(<code>groupOfNames</code>)、Membership LDAP Attribute(<code>member</code>)が LDAP の実際の値と一致しているかを見る。</p></div></div><div class="step"><h4>手順 2　トークンの groups を見る</h4><p>Group Membership Mapper(第11章で <code>frontend-spa-dedicated</code> に作成済み。無ければ作る)がある状態でトークンを取る。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=ldap-taro -d password=taro -d scope=openid \\
  | jq -r .access_token | cut -d. -f2 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .groups</pre><div class="check"><b>確認</b><pre class="out">[ "developers" ]</pre></div><div class="read"><b>読み方</b><p>groups に <code>developers</code> が出る。</p><p>出るなら、第11章の Group Membership Mapper が LDAP 由来の Group にも効いている。出ないなら Mapper の Add to access token と、トークンの取り直しを確認する。</p></div></div>`,
        oxIds: [] },
      { id: 'c13-l02-p03', title: `LDAP を止めて「問い合わせ先」を確かめる`,
        html: `<p class="goal">やりたいこと: User Federation では、ログインのたびに Keycloak が LDAP へパスワードを問い合わせる。LDAP を一時停止して、LDAP ユーザーだけがログインできなくなる様子を見る。あわせて Kerberos・User Storage SPI・Identity Brokering との違いを整理する。</p><div class="step"><h4>手順 1　LDAP が動いている間のログインを確認する</h4><p>LDAP ユーザーと、Keycloak ローカルのユーザーで、それぞれログインを試す。</p><pre>try_login() { curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=$1 -d password=$2 -d scope=openid \\
  | jq -c '{user: "'$1'", error, error_description, ok: (.access_token != null)}'; }
try_login ldap-taro taro
try_login alice alice</pre><div class="check"><b>確認</b><pre class="out">ldap-taro: ok:true
alice    : ok:true</pre></div><div class="read"><b>読み方</b><p>どちらも ok:true。ここが基準。</p></div></div><div class="step"><h4>手順 2　LDAP を止めてログインを試す</h4><pre>cd ~/develop/kc-handson
docker compose stop openldap
try_login ldap-taro taro
try_login alice alice</pre><div class="check"><b>確認</b><pre class="out">ldap-taro: エラー(例: {"error":"unknown_error","error_description":"For more on this error consult the server log."})、ok:false
alice    : ok:true</pre></div><div class="read"><b>読み方</b><p>手順1では通った ldap-taro だけ失敗する。</p><p>LDAP を止めると ldap-taro だけ失敗するなら、パスワード確認は LDAP 側で行われている。Import users が ON でもコピーしているのはユーザー情報で、パスワードは LDAP が持つ。運用では LDAP が止まると LDAP ユーザーがログインできなくなるため、LDAP の可用性も Keycloak の可用性に影響する。</p></div></div><div class="step"><h4>手順 3　LDAP を再開して試す</h4><pre>docker compose start openldap</pre><p>もう一度 <code>try_login ldap-taro taro</code> を実行する。</p><div class="check"><b>確認</b><pre class="out">ldap-taro:taro が ok:true に戻る(起動直後は数秒〜数十秒失敗が続くことがある。少し待って再実行)。</pre></div><div class="read"><b>読み方</b><p>戻れば、LDAP の停止が原因だったということ。</p></div></div><div class="step"><h4>手順 4　Federation link の有無を見比べる</h4><p>Users → <code>ldap-taro</code> と <code>alice</code> の画面を見比べる。</p><div class="check"><b>確認</b><pre class="out">ldap-taro には Federation link があり、alice には無い。</pre></div><div class="read"><b>読み方</b><ul><li>Federation は「名簿を Keycloak が直接読む」(ログイン画面は Keycloak のまま)。<b>Identity Brokering</b> は「ログイン自体を外部 IdP に任せる」(画面も外部へ転送)。Federation link と Identity provider links は別の仕組み。</li><li>Kerberos / SPNEGO は、Windows ドメインにログイン済みのブラウザからパスワード入力なしでログインさせる仕組み。</li><li><b>User Storage SPI</b> は、独自 DB などを Java でユーザー保管先として接続する拡張口。LDAP は標準で用意された 1 つの実装。</li></ul></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
// 第14章 セキュリティ・運用 (ハンズオン形式)
DATA.chapters.push({
  no: 14, title: `セキュリティ・運用`,
  lessons: [
    { id: 'c14-l01', title: `本番で守ること(理由つき)`, pages: [
      { id: 'c14-l01-p01', title: `Brute force detection でアカウントをロックさせる`,
        html: `<p class="goal">やりたいこと: パスワードの総当たり攻撃への対策が <b>Brute force detection</b>(連続ログイン失敗でアカウントを一時的または永久にロック)。有効にして、実際にロックされる様子を確認する。</p><div class="step"><h4>手順 1　Brute force detection を有効にする</h4><p>管理コンソールで realm <code>demo</code> → Realm settings の <b>Security defenses</b> タブにある <b>Brute force detection</b>(表記が異なる場合は近い項目を探す)。Enabled を ON、Max login failures=<code>3</code>、Wait increment=<code>1 minutes</code>(Mode は一時ロックのまま)にして Save する。</p><div class="check"><b>確認</b><pre class="out">Save が成功し、設定値が保持されている。</pre></div><div class="read"><b>読み方</b><p>一時ロックは待てば解除される。しきい値を超えたら管理者が解除するまで使えない「永久ロック」(Mode の選択)もある。厳しくするほど、攻撃者がわざとロックさせて正当なユーザーを締め出すリスクが増える。</p></div></div><div class="step"><h4>手順 2　ロック前の正常な状態を確認する</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=carol -d password=carol -d scope=openid | jq -c '{error, ok: (.access_token != null)}'</pre><div class="check"><b>確認</b><pre class="out">{"error":null,"ok":true}</pre></div><div class="read"><b>読み方</b><p>ok:true なら、carol は今ロックされておらず、正しいパスワードで入れる。ここが比べる基準(carol のパスワードを第12章で変えていたら、その値を使う)。</p></div></div><div class="step"><h4>手順 3　わざと3回失敗させる</h4><pre>for i in 1 2 3; do
  curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
    -d client_id=frontend-spa -d grant_type=password -d username=carol -d password=wrong -d scope=openid | jq -c .
done</pre><div class="check"><b>確認</b><pre class="out">{"error":"invalid_grant","error_description":"Invalid user credentials"}</pre></div><div class="read"><b>読み方</b><p>3回とも同じエラーが返る。</p><p><code>invalid_grant</code> はパスワード不一致の通常の失敗。ここまではロックされているかどうかはまだ分からない。</p></div></div><div class="step"><h4>手順 4　正しいパスワードで試す</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=carol -d password=carol -d scope=openid | jq -c '{error, error_description, ok: (.access_token != null)}'</pre><div class="check"><b>確認</b><pre class="out">正しいパスワードでも同じ invalid_grant / Invalid user credentials になり、ok:false。Users → carol の Details にロック状態(「Temporarily locked」などの表記。バージョンで異なる)が出る。</pre></div><div class="read"><b>読み方</b><p>手順2では ok:true だった同じ入力が失敗するなら、失敗回数がしきい値を超えてアカウント自体がロックされている。メッセージが「パスワードが違う」ときと同じなのは、ロックの事実を攻撃者に教えないための配慮。理由は Events(次のレッスン)で確認できる(ロック中の失敗は <code>LOGIN_ERROR</code> の error が <code>user_temporarily_disabled</code>、ロックされた瞬間は <code>USER_DISABLED_BY_TEMPORARY_LOCKOUT</code> イベント)。</p></div></div><div class="step"><h4>手順 5　待って解除を確認し、設定を戻す</h4><p>1 分以上待って、もう一度正しいパスワードで手順4を実行する。確認が終わったら Brute force detection を OFF に戻す(以降の章で何度もログインするため)。</p><div class="check"><b>確認</b><pre class="out">ok:true になる。</pre></div><div class="read"><b>読み方</b><p>待つと通るなら、一時ロックが時間で解除された。</p></div></div>`,
        oxIds: [] },
      { id: 'c14-l01-p02', title: `SSL required を変えて HTTPS 必須の意味を見る`,
        html: `<p class="goal">やりたいこと: トークンやパスワードの盗聴を防ぐため、本番では <b>HTTPS 必須</b>。realm の <b>Require SSL</b> がそれを制御する。学習環境は <code>start-dev</code>(HTTP 許可、開発専用)で動いているので、設定を切り替えて挙動を確かめる。</p><div class="step"><h4>手順 1　変更前に HTTP でトークンが取れることを確認する</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice -d scope=openid | jq -c 'keys'</pre><div class="check"><b>確認</b><pre class="out">["access_token", "expires_in", ...] のようにトークン応答のキーが出る。</pre></div><div class="read"><b>読み方</b><p>今は HTTP のままでトークンが取れる(Require SSL が External requests の既定)。この状態を基準に、次の手順で変える。</p></div></div><div class="step"><h4>手順 2　All requests に変えて HTTP を試す</h4><p>Realm settings の General にある <b>Require SSL</b>(表記が異なる場合は近い項目を探す)の現在値を確認し、<code>All requests</code> に変更して Save する。同じ curl を HTTP のまま実行する。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice -d scope=openid | jq .</pre><p>ブラウザでも http://localhost:8080/realms/demo/account を開き、ログインに進む。</p><div class="check"><b>確認</b><pre class="out">{"error":"invalid_request","error_description":"HTTPS required"}</pre></div><div class="read"><b>読み方</b><p>手順1では取れたのに、curl はエラー、ブラウザはログインへ進むところで HTTP 400。</p><p>HTTP が拒否されたなら、その realm は HTTPS 以外を受け付けない。本番ではこの状態(または外部アクセスのみ HTTPS 必須の既定)を保つ。</p></div></div><div class="step"><h4>手順 3　External requests に戻す</h4><p>Require SSL を <code>External requests</code> に戻して Save し、手順2の curl をもう一度実行する。</p><div class="check"><b>確認</b><pre class="out">トークンが取れる。</pre></div><div class="read"><b>読み方</b><p><code>External requests</code> では <code>localhost</code> など私的アドレスからの HTTP は通る。学習環境が HTTP で動くのはこのため。インターネットに公開する環境では使わない。</p></div></div><div class="step"><h4>手順 4　起動コマンドを確認する</h4><pre>docker compose ps --no-trunc --format json keycloak | jq -r .Command
docker compose logs keycloak | grep -i -m2 'development mode'</pre><div class="check"><b>確認</b><pre class="out">Running the server in development mode. DO NOT use this configuration in production.</pre></div><div class="read"><b>読み方</b><p>コマンドが <code>start-dev</code>、ログに開発モードの警告が出る。</p><p><code>start-dev</code> は開発専用(HTTP 許可・キャッシュ無効などの安全でない既定)。本番は <code>start</code> を使い、ホスト名(<code>KC_HOSTNAME</code>)・HTTPS・リバースプロキシの設定を正しく行う。</p></div></div>`,
        oxIds: [] },
      { id: 'c14-l01-p03', title: `本番チェックを設定画面で確認する`,
        html: `<p class="goal">やりたいこと: 「本番で守ること」を、設定画面で実際の値として確認し、危ない状態を理由と一緒に覚える。</p><div class="step"><h4>手順 1　登録外の redirect_uri を拒否させる</h4><pre>curl -s -i "http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=frontend-spa&amp;response_type=code&amp;scope=openid&amp;redirect_uri=http%3A%2F%2Fevil.example%2Fcb" | head -n 12</pre><div class="check"><b>確認</b><pre class="out">Invalid parameter: redirect_uri</pre></div><div class="read"><b>読み方</b><p>HTTP 400 とエラーページが返る。</p><p>拒否されたなら、Valid redirect URIs の検証が code の横流しを防いでいる。ここを <code>*</code> のような広い指定にすると、攻撃者の URL に code が流れる(オープンリダイレクト)。</p></div></div><div class="step"><h4>手順 2　client の設定を見る</h4><p>Clients → <code>frontend-spa</code> → Settings で <b>Valid redirect URIs</b> と、Capability config の <b>Direct access grants</b>(Password Grant)・Implicit flow を見る。</p><div class="check"><b>確認</b><pre class="out">Valid redirect URIs は http://localhost:3000/* のように必要な範囲に限定されている。Direct access grants は学習中のみ ON で、使い終わったら OFF にする。</pre></div><div class="read"><b>読み方</b><p><code>*</code> だけの全許可なら危険。Direct access grants が ON のままなら学習用に開けた穴が残っている。ID とパスワードをアプリが直接扱う方式は避ける。</p></div></div><div class="step"><h4>手順 3　トークン寿命を見る</h4><p>Realm settings → Tokens で <b>Access Token Lifespan</b> を確認する。<b>Revoke Refresh Token</b> を ON にすると Refresh Token Rotation になる。</p><div class="check"><b>確認</b><pre class="out">Access Token Lifespan は 5 minutes(既定)。</pre></div><div class="read"><b>読み方</b><p>Access Token は短命ほど安全で、Refresh Token Rotation を併用する。</p></div></div><div class="step"><h4>手順 4　master realm のユーザーを見る</h4><p>左上の realm 切替で master を開き、Users を見る。</p><div class="check"><b>確認</b><pre class="out">Users は admin のみ。</pre></div><div class="read"><b>読み方</b><p>master に業務ユーザーがいるなら要注意。master は全 realm の管理権限につながるので、業務ユーザーは別 realm に置く。SPA は Public + PKCE(S256)、secret は Git に入れず環境変数やシークレット管理で渡す(学習用の値は例外)、という原則も、同様に設定画面の値で確認できる。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c14-l02', title: `鍵管理・監視・構成・設定優先順位・テーマ/SPI`, pages: [
      { id: 'c14-l02-p01', title: `署名鍵の一覧を見て JWKS と対応づける`,
        html: `<p class="goal">やりたいこと: トークンの署名鍵は Realm settings → <b>Keys</b> で管理される。鍵の一覧、API が取りに行く JWKS、トークンヘッダの <code>kid</code> が同じ鍵を指していることを確認する。</p><div class="step"><h4>手順 1　鍵の一覧を見る</h4><p>Realm settings の <b>Keys</b> タブで鍵の一覧(Keys list)を開き、Algorithm・Type・Kid・Use・Provider・Priority を見る。<b>Providers</b> サブタブでは <code>rsa-generated</code>(署名用 RSA)、<code>rsa-enc-generated</code>(暗号化用 RSA)、<code>hmac-generated-hs512</code>、<code>aes-generated</code> を確認する。</p><div class="check"><b>確認</b><pre class="out">署名用 RSA(rsa-generated)の Kid を控える。</pre></div><div class="read"><b>読み方</b><p>同じ種類の鍵が複数あるとき、<b>Priority</b> が大きい鍵で署名される。次のページでこれを利用して鍵を入れ替える。</p></div></div><div class="step"><h4>手順 2　JWKS を取る</h4><pre>curl -s http://localhost:8080/realms/demo/protocol/openid-connect/certs | jq '.keys[] | {kid, alg, use}'</pre><div class="check"><b>確認</b><pre class="out">{ "kid": "(Keys list の署名用 RSA の Kid と同じ)", "alg": "RS256", "use": "sig" }</pre></div><div class="read"><b>読み方</b><p>Keys list の署名用 RSA と同じ kid が出る。</p><p>JWKS に出るのは公開鍵だけで、秘密鍵は Keycloak の外に出ない。<code>use</code> が <code>sig</code> なら署名用、<code>enc</code> なら暗号化用。</p></div></div><div class="step"><h4>手順 3　トークンヘッダの kid を見る</h4><pre>get_token() { curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=$1 -d password=$2 -d scope=openid | jq -r .access_token; }
jwth() { cut -d. -f1 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .; }
TOKEN=$(get_token alice alice)
echo $TOKEN | jwth</pre><div class="check"><b>確認</b><pre class="out">{ "alg": "RS256", "typ": "JWT", "kid": "(同じ値)" }</pre></div><div class="read"><b>読み方</b><p>ヘッダの <code>kid</code> が手順2と同じ値。</p><p>一致するなら、このトークンはその鍵で署名された。API は <code>kid</code> で JWKS から公開鍵を選んで検証する。</p></div></div>`,
        oxIds: [] },
      { id: 'c14-l02-p02', title: `鍵をローテーションして旧トークンの扱いを見る`,
        html: `<p class="goal">やりたいこと: 鍵は定期的に入れ替える。手順は、新しい鍵を作って Priority を高くする → 旧鍵を Passive にする → 旧トークンが失効する頃に旧鍵を無効にする、の順。API が JWKS を取り直して kid で鍵を選ぶことの大切さを、自作 API で確認する。<code>get_token</code> / <code>jwth</code> は手順1で定義する。自作 API は jwt モード(audience=<code>api-service</code>)で動いている前提(第10章)。</p><div class="step"><h4>手順 1　旧鍵のトークンを控える</h4><pre>get_token() { curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=$1 -d password=$2 -d scope=openid | jq -r .access_token; }
jwth() { cut -d. -f1 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .; }
OLD=$(get_token alice alice)
echo $OLD | jwth | jq -r .kid
call() { curl -s -w '  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $1" http://localhost:4000$2; }
call $OLD /me</pre><div class="check"><b>確認</b><pre class="out">旧鍵の kid が表示され、call $OLD /me が 200。</pre></div><div class="read"><b>読み方</b><p>ここが基準。以降 <code>$OLD</code> がどう扱われるかを見る。</p></div></div><div class="step"><h4>手順 2　新しい鍵を追加する</h4><p>Realm settings → Keys → Providers → <b>Add provider</b> → <code>rsa-generated</code>。Name=<code>rsa-new</code>、Priority=<code>200</code>(既存より大きい値)→ Save。続けて新しいトークンを取り、新旧を自作 API に渡す。</p><pre>NEW=$(get_token alice alice)
echo $NEW | jwth | jq -r .kid
call $NEW /me
call $OLD /me</pre><div class="check"><b>確認</b><pre class="out">$NEW の kid が $OLD と違い、call $NEW /me も call $OLD /me も 200。</pre></div><div class="read"><b>読み方</b><p>新鍵を足した直後も旧トークンが通るのは、旧鍵がまだ JWKS に載っているから。だから鍵の入れ替えで一斉にログアウトさせずに済む。直後の <code>call $NEW /me</code> が 401(<code>ERR_JWKS_NO_MATCHING_KEY</code>)になることがある。jose は未知の kid を見つけても、直前の JWKS 取得から 30 秒は再取得しない(クールダウン)ため。約 30 秒待ってやり直すと 200 になる。</p></div></div><div class="step"><h4>手順 3　旧鍵を Passive にする</h4><p>Providers の旧い <code>rsa-generated</code> を開き、<b>Active</b> を OFF(Passive 化)にして Save。JWKS と自作 API を確認する。</p><pre>curl -s http://localhost:8080/realms/demo/protocol/openid-connect/certs | jq -r '.keys[] | select(.use=="sig") | .kid'
call $OLD /me</pre><div class="check"><b>確認</b><pre class="out">JWKS には旧鍵も新鍵も出て、call $OLD /me は 200。</pre></div><div class="read"><b>読み方</b><p>Passive は検証だけに使う状態。署名は新鍵で行い、旧トークンの検証用に旧鍵が残っている。旧トークンが全部失効する頃(Access Token の寿命 + 余裕)に旧鍵を Disabled にして削除する。</p></div></div><div class="step"><h4>手順 4　旧鍵を Disabled にして API を再起動する</h4><p>旧 <code>rsa-generated</code> の <b>Enabled</b> も OFF にして Save。同じコマンドを実行する(この時点ではまだ 200)。続けて自作 API を止め(Ctrl+C)て <code>AUDIENCE=api-service node server.js</code> で起動し直し、もう一度 <code>call $OLD /me</code> を実行する。</p><pre>curl -s http://localhost:8080/realms/demo/protocol/openid-connect/certs | jq -r '.keys[] | select(.use=="sig") | .kid'
call $OLD /me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"ERR_JWKS_NO_MATCHING_KEY: no applicable key found in the JSON Web Key Set"}</pre></div><div class="read"><b>読み方</b><p>JWKS から旧鍵の kid が消える。再起動前は 200 のまま、再起動後は 401。Keycloak 自身の userinfo に旧トークンを渡しても 401。</p><p>再起動前に 200 なのは、自作 API が JWKS をキャッシュしているため(jose は、キャッシュ済みの kid なら最大 10 分は JWKS を取り直さない)。つまり鍵を無効にしても、API 側のキャッシュが切れるまで旧トークンが通ることがある。失効を即時にしたいなら Introspection(第10章)を使う。逆に新トークンが通らないなら、API が古い JWKS を持ち続けている(またはクールダウン中)疑いが強い。</p></div></div><div class="step"><h4>手順 5　後片付けをする</h4><p>旧鍵の Enabled / Active を ON に戻す。<code>rsa-new</code> は残してよい。</p><div class="check"><b>確認</b><pre class="out">get_token でトークンが取れ、call が 200。</pre></div><div class="read"><b>読み方</b><p>通れば元の状態に戻っており、以降の章への影響は無い。</p></div></div>`,
        oxIds: [] },
      { id: 'c14-l02-p03', title: `Events を有効にしてログインの成功と失敗を記録する`,
        html: `<p class="goal">やりたいこと: 運用では「誰がいつログインに失敗したか」「誰が設定を変えたか」を後から追える必要がある。<b>User events</b>(ログイン・ログアウトなど)と <b>Admin events</b>(管理操作)を有効にして、記録を見る。</p><div class="step"><h4>手順 1　Events を有効にする</h4><p>Realm settings → <b>Events</b> タブ → User events settings で <b>Save events</b> を ON にして Save。Admin events settings で <b>Save admin events</b> と Include representation も ON にして Save。</p><div class="check"><b>確認</b><pre class="out">両方の Save が成功する。</pre></div><div class="read"><b>読み方</b><p>ON にする前の操作は記録されない。後で空になったら、ON にした時点より前の操作ではないかを疑う。</p></div></div><div class="step"><h4>手順 2　ログインを失敗・成功させて User events を見る</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=wrong -d scope=openid | jq -c .error
curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice -d scope=openid | jq -c '.token_type'</pre><div class="check"><b>確認</b><pre class="out">LOGIN_ERROR (alice, client=frontend-spa, error=invalid_user_credentials 相当)
LOGIN (alice, client=frontend-spa)</pre></div><div class="read"><b>読み方</b><p>左メニュー <b>Events</b> の User events タブに 2 件並ぶ。</p><p><code>LOGIN_ERROR</code> に失敗理由(error)が入っているなら、ユーザーには曖昧なエラーしか返さなくても、管理者は原因を追える。「Invalid parameter: redirect_uri」などの原因調査にも使える。</p></div></div><div class="step"><h4>手順 3　管理操作をして Admin events を見る</h4><p>Users → <code>bob</code> の First name を <code>Bob</code> に変更して Save し、Events の Admin events タブを開く。</p><div class="check"><b>確認</b><pre class="out">UPDATE が記録され、リソースは users/(bob の ID)、操作したユーザーは admin。</pre></div><div class="read"><b>読み方</b><p>Representation(変更後の内容)まで見えるなら「誰が・いつ・何を」変えたかを追跡できる。ただし表現に機密が入りうるので、保存期間(Realm settings → Events)と閲覧権限に注意する。</p></div></div>`,
        oxIds: [] },
      { id: 'c14-l02-p04', title: `ヘルス・メトリクス・設定の優先順位・テーマ`,
        html: `<p class="goal">やりたいこと: 運用で必要な「動いているか(Health)」「どれだけ負荷か(Metrics)」を確かめ、設定の出どころ(環境変数 / コマンド引数 / conf ファイル)と、ログイン画面を変える Theme を触る。</p><div class="step"><h4>手順 1　ヘルスとメトリクスを有効にする</h4><p><code>~/develop/kc-handson/docker-compose.yml</code> の keycloak の <code>environment</code> に次の 2 行を追加して再作成する(DB のデータは残る)。</p><pre>      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "true"</pre><pre>cd ~/develop/kc-handson
docker compose up -d
docker compose ps keycloak</pre><div class="check"><b>確認</b><pre class="out">keycloak が running。</pre></div><div class="read"><b>読み方</b><p>running でなければ <code>docker compose logs keycloak</code> で起動エラーを見る(インデントや引用符の誤りが多い)。</p></div></div><div class="step"><h4>手順 2　ヘルスチェックを見る</h4><p>管理用のポート 9000 はコンテナ内から見る。</p><pre>docker compose exec keycloak bash -c 'exec 3&lt;&gt;/dev/tcp/127.0.0.1/9000; printf "GET /health/ready HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n" &gt;&amp;3; cat &lt;&amp;3'</pre><div class="check"><b>確認</b><pre class="out">{ "status": "UP", ... }</pre></div><div class="read"><b>読み方</b><p>応答に UP が含まれる。</p><p><code>"status": "UP"</code> なら Keycloak がリクエストを受けられる。Kubernetes の probe やロードバランサの死活監視に使う。</p></div></div><div class="step"><h4>手順 3　メトリクスを見る</h4><pre>docker compose exec keycloak bash -c 'exec 3&lt;&gt;/dev/tcp/127.0.0.1/9000; printf "GET /metrics HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n" &gt;&amp;3; cat &lt;&amp;3' | head -n 20</pre><div class="check"><b>確認</b><pre class="out">「# TYPE ...」「# HELP ...」の行が並ぶ Prometheus(OpenMetrics)形式のテキストが出る。</pre></div><div class="read"><b>読み方</b><p>出れば、監視ツールがこの URL を定期的に取りに行ける。<code>KC_METRICS_ENABLED</code> を入れていないと出ない。</p></div></div><div class="step"><h4>手順 4　設定の出どころを見る</h4><pre>docker compose exec keycloak env | grep '^KC_' | grep -v PASSWORD</pre><div class="check"><b>確認</b><pre class="out">自分の compose に書いた KC_ 変数(KC_HEALTH_ENABLED など)が出る。</pre></div><div class="read"><b>読み方</b><p>設定の優先順位は、コマンドライン引数 &gt; 環境変数(<code>KC_...</code>)&gt; <code>conf/keycloak.conf</code>。この環境は環境変数で渡している。DB の種類など「ビルド時」に決まる設定と、ホスト名など「起動時」に変えられる設定がある。</p></div></div><div class="step"><h4>手順 5　Theme を変える</h4><p>先に、シークレットウィンドウで http://localhost:8080/realms/demo/account を開いて現在のログイン画面を見ておく。次に Realm settings → <b>Themes</b> タブ → Login theme を <code>base</code> に変更して Save し、別のシークレットウィンドウで同じ URL を開く。確認後は元の値(未選択または <code>keycloak</code>)に戻す。</p><div class="check"><b>確認</b><pre class="out">変更前: 通常の見た目のログイン画面
変更後: スタイルの無い素朴なログイン画面になる。</pre></div><div class="read"><b>読み方</b><p>変更前と見た目が変わったなら、Theme は realm 単位で差し替えられる。本格的なカスタムは FreeMarker テンプレートと CSS(React なら Keycloakify)。独自の認証手順や claim などの機能は、Java の <b>SPI</b> で JAR を <code>providers/</code> に置いて拡張する。</p></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
// 第15章 Admin REST API (ハンズオン形式)
DATA.chapters.push({
  no: 15, title: `Admin REST API`,
  lessons: [
    { id: 'c15-l01', title: `概要・トークンの取り方・必要ロール`, pages: [
      { id: 'c15-l01-p01', title: `管理用トークンを取って Admin REST API を呼ぶ`,
        html: `<p class="goal">やりたいこと: <b>Admin REST API</b> は、管理コンソールでできる操作(ユーザー作成・Client 設定など)を HTTP で自動化するもの。ベース URL は <code>http://localhost:8080/admin/realms/{realm}/...</code> で、管理権限を持つ Access Token を <code>Authorization: Bearer</code> で付けて呼ぶ。</p><div class="step"><h4>手順 1　トークン無しで呼ぶ</h4><pre>curl -s -i http://localhost:8080/admin/realms/demo/users | head -n 1</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 401 Unauthorized</pre></div><div class="read"><b>読み方</b><p>ステータス行を見る。</p><p>401 なら、Admin REST API は管理権限を持つ Access Token で守られている。</p></div></div><div class="step"><h4>手順 2　管理者トークンを取る</h4><p>master realm の <code>admin-cli</code>(最初から入っている管理用 Public client)から Password Grant で取る。</p><pre>ATOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \\
  -d client_id=admin-cli -d grant_type=password -d username=admin -d password=admin | jq -r .access_token)
echo $ATOKEN | cut -d. -f2 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq '{iss, azp, exp, iat}'</pre><div class="check"><b>確認</b><pre class="out">{ "iss": "http://localhost:8080/realms/master", "azp": "admin-cli", "exp": ..., "iat": ... }</pre></div><div class="read"><b>読み方</b><p>payload の <code>iss</code> と <code>azp</code> を見る。</p><p><code>iss</code> が <code>.../realms/master</code> で <code>azp</code> が <code>admin-cli</code> なら、管理者は master realm にいて、demo realm の管理もそのトークンでできる。取得先が master なのはそのため。寿命は短い(既定 1 分)ので、後で 401 が返ったらトークンを取り直す。</p></div></div><div class="step"><h4>手順 3　トークンを付けてユーザー一覧を取る</h4><pre>curl -s -i -H "Authorization: Bearer $ATOKEN" http://localhost:8080/admin/realms/demo/users | head -n 1
curl -s -H "Authorization: Bearer $ATOKEN" http://localhost:8080/admin/realms/demo/users | jq '.[] | {id, username, enabled}'</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 200 OK
{ "id": "(UUID)", "username": "alice", "enabled": true }
{ "id": "(UUID)", "username": "bob", "enabled": true }
...</pre></div><div class="read"><b>読み方</b><p>200 とユーザー一覧が返る。</p><p>手順1が 401、ここが 200 なら、トークンが認可として効いている。<code>admin-cli</code> + Password Grant は試すとき用。自動化・本番では専用 Client の Client Credentials を使う(次のページ)。</p></div></div>`,
        oxIds: [] },
      { id: 'c15-l01-p02', title: `専用 Client + 最小ロールで呼ぶ(403 を起こして直す)`,
        html: `<p class="goal">やりたいこと: 本番では管理者のパスワードではなく、専用の Client(<b>Service account</b>)に必要最小限のロールだけ与えて呼ぶ。Admin API の権限は <code>realm-management</code> という Client のロール(<code>view-users</code>・<code>manage-users</code> など)で決まる。ロールが足りないときの 403 を見て、足して直す。</p><div class="step"><h4>手順 1　admin-bot を作る</h4><p>管理コンソールで realm <code>demo</code> → Clients → Create client。Client ID=<code>admin-bot</code>。Client authentication=ON、<b>Service accounts roles</b>=ON、Standard flow=OFF → Save。Credentials タブの Client secret をコピーして変数に入れる。</p><pre>BOT_SECRET='ここに貼る'</pre><div class="check"><b>確認</b><pre class="out">Clients 一覧に admin-bot があり、Credentials タブに secret が表示される。</pre></div><div class="read"><b>読み方</b><p>Credentials タブが無ければ Client authentication が OFF になっている。</p></div></div><div class="step"><h4>手順 2　view-users だけ付けて読み取りと作成を試す</h4><p><code>admin-bot</code> → <b>Service accounts roles</b> タブ → Assign role → Filter by clients に切り替え、<code>realm-management</code> の <code>view-users</code> だけを付ける。</p><pre>BTOKEN=$(curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -u admin-bot:$BOT_SECRET -d grant_type=client_credentials | jq -r .access_token)
curl -s -o /dev/null -w 'GET users  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $BTOKEN" http://localhost:8080/admin/realms/demo/users
curl -s -w '  -&gt; HTTP %{http_code}\\n' -X POST -H "Authorization: Bearer $BTOKEN" -H 'Content-Type: application/json' \\
  -d '{"username":"bot-made","enabled":true}' http://localhost:8080/admin/realms/demo/users</pre><div class="check"><b>確認</b><pre class="out">GET users  -&gt; HTTP 200
{"error":"HTTP 403 Forbidden"}  -&gt; HTTP 403</pre></div><div class="read"><b>読み方</b><p>読み取りは 200、作成は 403。</p><p>読み取りだけ通り作成が 403 なら、<code>view-users</code> は参照だけで、作成・変更には <code>manage-users</code> が要る。ロールが細かく分かれているので、必要なものだけ付けられる。</p></div></div><div class="step"><h4>手順 3　manage-users を足して作成し直す</h4><p>Service accounts roles に <code>manage-users</code> も追加し、トークンを取り直して、もう一度作成する。</p><pre>BTOKEN=$(curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -u admin-bot:$BOT_SECRET -d grant_type=client_credentials | jq -r .access_token)
curl -s -i -X POST -H "Authorization: Bearer $BTOKEN" -H 'Content-Type: application/json' \\
  -d '{"username":"bot-made","enabled":true}' http://localhost:8080/admin/realms/demo/users | head -n 8</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 201 Created
Location: http://localhost:8080/admin/realms/demo/users/(新しいユーザーの UUID)</pre></div><div class="read"><b>読み方</b><p>201 と <code>Location</code> ヘッダが返る。</p><p>201 なら作成成功で、<code>Location</code> の末尾が新しいユーザーの ID。ロールを足した直後でも 403 のままなら、古いトークンを使っているだけ(ロールはトークン発行時に載る)。<code>realm-admin</code> は全権限で強すぎるので、自動化には必要な <code>view-*</code> / <code>manage-*</code> / <code>query-*</code> だけを付ける。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c15-l02', title: `主な API・自動化手段`, pages: [
      { id: 'c15-l02-p01', title: `ユーザーを検索・作成・ロール付与・削除する`,
        html: `<p class="goal">やりたいこと: ユーザー管理の典型操作(検索・作成・ロール付与・削除)を curl で一通り行う。URL に出てくる<b>ユーザー ID(UUID)</b>を、検索結果から取って次の操作に渡す流れを覚える。</p><div class="step"><h4>手順 1　変数を用意してユーザーを検索する</h4><p>管理者トークンを取り、変数を用意する。</p><pre>KC=http://localhost:8080/admin/realms/demo
ATOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \\
  -d client_id=admin-cli -d grant_type=password -d username=admin -d password=admin | jq -r .access_token)
H="Authorization: Bearer $ATOKEN"
curl -s -H "$H" "$KC/users?username=alice&amp;exact=true" | jq '.[0] | {id, username, email}'</pre><div class="check"><b>確認</b><pre class="out">{ "id": "(UUID)", "username": "alice", "email": "alice@example.com" }</pre></div><div class="read"><b>読み方</b><p>alice の id・username・email が返る。</p><p><code>id</code> が以降の URL で使う UUID。Username とは別物。</p></div></div><div class="step"><h4>手順 2　ユーザーを作る</h4><pre>curl -s -i -X POST -H "$H" -H 'Content-Type: application/json' $KC/users \\
  -d '{"username":"api-user","email":"api-user@example.com","firstName":"Api","lastName":"User","enabled":true,"emailVerified":true,"credentials":[{"type":"password","value":"pass1234","temporary":false}]}' | head -n 8</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 201 Created</pre></div><div class="read"><b>読み方</b><p>ステータス行が 201。</p><p>409 Conflict は同じ Username が既にあるということ。</p></div></div><div class="step"><h4>手順 3　Realm role を付与する</h4><p>作ったユーザーの ID を取り、Realm role <code>user</code> の定義をそのまま付与の本文に使う。</p><pre>USER_ID=$(curl -s -H "$H" "$KC/users?username=api-user&amp;exact=true" | jq -r '.[0].id')
ROLE=$(curl -s -H "$H" $KC/roles/user)
curl -s -i -X POST -H "$H" -H 'Content-Type: application/json' $KC/users/$USER_ID/role-mappings/realm -d "[$ROLE]" | head -n 1
curl -s -H "$H" $KC/users/$USER_ID/role-mappings/realm | jq '.[].name'</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 204 No Content
"default-roles-demo"
"user"</pre></div><div class="read"><b>読み方</b><p>付与が 204、一覧に <code>user</code> が入る。</p><p>204 は「成功したが返す本文は無い」。付与が 400 なら、Realm role <code>user</code> が無く <code>$ROLE</code> にエラーの JSON が入っているので、管理コンソールの Realm roles で作ってから試す。404 は URL の UUID の誤り。Realm role は <code>role-mappings/realm</code>、Client role は <code>role-mappings/clients/{client の UUID}</code> に送る。</p></div></div><div class="step"><h4>手順 4　作ったユーザーでログインする</h4><p><code>frontend-spa</code> の Direct access grants が ON であること。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=password -d username=api-user -d password=pass1234 | jq 'keys'</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", ... ]</pre></div><div class="read"><b>読み方</b><p>トークン応答のキーが並ぶ。</p><p>トークンが取れたなら、Admin API で作ったユーザーは管理コンソールで作ったものと同じ。</p></div></div><div class="step"><h4>手順 5　ユーザーを削除する</h4><pre>curl -s -i -X DELETE -H "$H" $KC/users/$USER_ID | head -n 1</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 204 No Content</pre></div><div class="read"><b>読み方</b><p>ステータス行が 204。</p><p>204 なら削除成功。管理コンソールの Users から消えている。</p></div></div>`,
        oxIds: [] },
      { id: 'c15-l02-p02', title: `Client を検索して UUID と secret を取る・作る`,
        html: `<p class="goal">やりたいこと: Client には 2 種類の名前がある。人が付ける <b>clientId</b>(<code>frontend-spa</code> など)と、Admin API の URL で使う <b>UUID(<code>id</code>)</b>。検索で clientId から UUID を引き、secret の取得や Client の作成を行う。この手順では、次の変数を使う(トークンは短命なので、毎回取り直してよい)。</p><div class="step"><h4>手順 1　clientId から UUID を引く</h4><pre>KC=http://localhost:8080/admin/realms/demo
ATOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \\
  -d client_id=admin-cli -d grant_type=password -d username=admin -d password=admin | jq -r .access_token)
H="Authorization: Bearer $ATOKEN"
curl -s -H "$H" "$KC/clients?clientId=frontend-spa" | jq '.[0] | {id, clientId, publicClient}'
CID=$(curl -s -H "$H" "$KC/clients?clientId=api-service" | jq -r '.[0].id')
echo $CID</pre><div class="check"><b>確認</b><pre class="out">{ "id": "(UUID)", "clientId": "frontend-spa", "publicClient": true }</pre></div><div class="read"><b>読み方</b><p><code>frontend-spa</code> の情報と、<code>api-service</code> の UUID が出る。</p><p><code>publicClient</code> が <code>true</code> なら Client authentication=OFF の Public client で、secret は無い。URL の <code>{id}</code> に clientId(<code>frontend-spa</code>)を入れると 404 になるので、必ず検索で UUID を引く。</p></div></div><div class="step"><h4>手順 2　secret を取る</h4><p>Confidential client(<code>api-service</code>)の secret を取り、管理コンソールの Credentials タブの値と比べる。</p><pre>curl -s -H "$H" $KC/clients/$CID/client-secret | jq .</pre><div class="check"><b>確認</b><pre class="out">{ "type": "secret", "value": "(api-service の secret)" }</pre></div><div class="read"><b>読み方</b><p>画面の値と一致する。</p><p>一致するなら、画面と API は同じ設定を見ている。secret の取得は <code>view-clients</code> / <code>manage-clients</code> が必要な機微な操作。</p></div></div><div class="step"><h4>手順 3　Client を作って secret を取る</h4><p>作る前に、<code>made-by-api</code> がまだ無いことを確かめる。</p><pre>curl -s -H "$H" "$KC/clients?clientId=made-by-api" | jq 'length'</pre><p>続けて作る。</p><pre>curl -s -i -X POST -H "$H" -H 'Content-Type: application/json' $KC/clients \\
  -d '{"clientId":"made-by-api","publicClient":false,"serviceAccountsEnabled":true,"standardFlowEnabled":false}' | head -n 4
NEW=$(curl -s -H "$H" "$KC/clients?clientId=made-by-api" | jq -r '.[0].id')
curl -s -H "$H" $KC/clients/$NEW/client-secret | jq .</pre><div class="check"><b>確認</b><pre class="out">0   (作る前は無い)
HTTP/1.1 201 Created
{ "type": "secret", "value": "(新しい secret)" }</pre></div><div class="read"><b>読み方</b><p>201 と新しい secret が返り、作る前は 0 件だった <code>made-by-api</code> が、管理コンソールの Clients に増える。</p><p>403 なら、呼ぶ側のトークンに <code>realm-management</code> の <code>manage-clients</code> が足りない。</p></div></div><div class="step"><h4>手順 4　Client を削除する</h4><pre>curl -s -i -X DELETE -H "$H" $KC/clients/$NEW | head -n 1</pre><div class="check"><b>確認</b><pre class="out">HTTP/1.1 204 No Content</pre></div><div class="read"><b>読み方</b><p>ステータス行が 204。</p><p>204 なら削除成功で、Clients 一覧から消えている。</p></div></div>`,
        oxIds: [] },
      { id: 'c15-l02-p03', title: `kcadm.sh と Partial export で自動化・書き出しをする`,
        html: `<p class="goal">やりたいこと: curl 以外の自動化手段を確かめる。<b>kcadm.sh</b> は Keycloak 同梱の CLI で、Admin API のラッパー。設定の書き出し(Partial export)は環境の複製や保管に使う。ほかに、宣言的に管理する Terraform provider もある。</p><div class="step"><h4>手順 1　kcadm でログインして一覧する</h4><pre>cd ~/develop/kc-handson
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh config credentials \\
  --server http://localhost:8080 --realm master --user admin --password admin
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh get users -r demo --fields username,enabled
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh get clients -r demo --fields clientId</pre><div class="check"><b>確認</b><pre class="out">[ { "username": "alice", "enabled": true }, { "username": "bob", ... }, ... ]
[ { "clientId": "account" }, ..., { "clientId": "frontend-spa" }, ... ]</pre></div><div class="read"><b>読み方</b><p>curl と同じ一覧が出る。</p><p>curl と同じ結果なら、kcadm は Admin REST API を呼ぶ道具。シェルスクリプトでの自動化に向く。</p></div></div><div class="step"><h4>手順 2　kcadm でユーザーを作って消す</h4><pre>docker compose exec keycloak /opt/keycloak/bin/kcadm.sh create users -r demo -s username=kcadm-user -s enabled=true
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh get users -r demo -q username=kcadm-user --fields id,username
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh delete users/(上で出た id) -r demo</pre><div class="check"><b>確認</b><pre class="out">Created new user with id '(UUID)'</pre></div><div class="read"><b>読み方</b><p>作成時にメッセージが出て、検索で id が取れる。</p><p><code>delete</code> は検索で出た id を指定する。エラーなく終われば削除済み。</p></div></div><div class="step"><h4>手順 3　Partial export する</h4><p>管理コンソールの Realm settings → 右上の Action → <b>Partial export</b> で、Groups and roles / Clients を含めて Export する。ダウンロードした JSON を調べる。</p><pre>jq '.clients[] | {clientId, publicClient}' realm-export.json</pre><div class="check"><b>確認</b><pre class="out">{ "clientId": "frontend-spa", "publicClient": true }</pre></div><div class="read"><b>読み方</b><p><code>clients</code> の中に <code>frontend-spa</code> などが入っている。</p><ul><li>Client の設定が入るなら、設定をファイルとして保管・別環境へ持ち出せる。ただし secret は伏せ字(<code>**********</code>)になり、alice・bob などの通常のユーザーは含まれない(Partial export の性質。Service accounts roles を持つ Client のサービスアカウントユーザーは入ることがある)。</li><li>目安: 1 回きりの操作は管理コンソール、スクリプトは kcadm か curl、環境をコードで管理するなら Terraform、サービスから呼ぶなら Admin REST API。</li><li>別物として <b>Account REST API</b> がある。ユーザー本人が自分の情報を操作する API で、Admin API とは権限も URL も違う。</li></ul></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
// 第16章 手を動かす(ハンズオン): 総まとめ (自作 SPA → Keycloak → 自作 API を一周する)
DATA.chapters.push({
  no: 16, title: `手を動かす(ハンズオン)`,
  lessons: [
    { id: 'c16-l01', title: `ゴールと準備・Step 0〜3`, pages: [
      { id: 'c16-l01-p01', title: `全体の地図: 一周でつなぐものと起動する4つのプロセス`,
        html: `<p class="goal">やりたいこと: 総まとめ。第1〜15章で作った部品を、<b>自作 SPA → Keycloak → 自作 API</b> の1本につなげて一周し、最後にわざと壊して原因を切り分ける。新しい設定手順は出てこない。足りないものは、示した章に戻って作る。</p><div class="step"><h4>手順 1　使う部品を確認する</h4><table><tr><th>部品</th><th>役割</th><th>作った章</th></tr><tr><td>Realm <code>demo</code>、ユーザー <code>alice</code> / <code>bob</code>(パスワードはユーザー名と同じ)</td><td>舞台と登場人物。<code>alice</code> には Realm Role <code>admin</code> を付けてある</td><td>第1章</td></tr><tr><td><code>frontend-spa</code>(Public)と <code>~/develop/kc-handson/spa/index.html</code></td><td>:3000 の自作 SPA。Authorization Code + PKCE でログイン</td><td>第2・5・7章</td></tr><tr><td><code>backend-web</code>(Confidential)と <code>~/develop/kc-handson/web/server.js</code></td><td>:3001 の自作 Web アプリ。secret はサーバー内だけ</td><td>第6章</td></tr><tr><td><code>api-service</code>(Confidential)と <code>~/develop/kc-handson/api/server.js</code></td><td>:4000 の自作 API。トークンの宛先(<code>aud</code>)であり、Introspection の呼び出し元</td><td>第2・8・10章</td></tr><tr><td><code>batch-job</code>(Confidential + Service accounts roles)</td><td>ユーザー不在のクライアント</td><td>第6・9章</td></tr><tr><td>Client Scope <code>orders:read</code>、Audience Mapper <code>aud-api-service</code></td><td>API の scope 検査と <code>aud</code> 検査の材料</td><td>第4章</td></tr><tr><td><code>~/develop/kc-handson/kc-lab.sh</code></td><td><code>get_token</code>・<code>jwt</code>・<code>jwth</code>、環境変数 <code>OIDC</code>・<code>API_SECRET</code>・<code>WEB_SECRET</code>・<code>BATCH_SECRET</code></td><td>第2・6・9章</td></tr></table><div class="check"><b>確認</b><pre class="out">表の部品がすべて手元にある。</pre></div><div class="read"><b>読み方</b><p>足りないものがあれば、右端の章に戻って作る。この章の流れは、SPA でログインして一周(第7章)→ トークンを読み Evaluate・Userinfo・JWKS と突き合わせる(第3・4・8章)→ Confidential の Web アプリと Client Credentials を同じ API に通す(第6・9章)→ <code>aud</code>・Role・scope で API の認可を通す(第4・10・11章)→ Refresh・失効と障害切り分け課題。</p></div></div><div class="step"><h4>手順 2　4つのプロセスを起動して応答を確かめる</h4><p>別々のターミナルで起動する(各ファイルは前の章のものをそのまま使う)。</p><pre># 1) Keycloak (:8080)
cd ~/develop/kc-handson &amp;&amp; docker compose up -d

# 2) SPA (:3000)
cd ~/develop/kc-handson/spa &amp;&amp; python3 -m http.server 3000

# 3) Web アプリ (:3001)  ※ secret は環境変数で渡す
source ~/develop/kc-handson/kc-lab.sh
cd ~/develop/kc-handson/web &amp;&amp; CLIENT_SECRET=$WEB_SECRET node server.js

# 4) API (:4000)  ※ 第10章版の server.js。aud を検査する設定で起動
cd ~/develop/kc-handson/api &amp;&amp; AUDIENCE=api-service node server.js</pre><p>別のターミナルで応答を見る。</p><pre>curl -s -o /dev/null -w 'keycloak %{http_code}\\n' http://localhost:8080/realms/demo/.well-known/openid-configuration
curl -s -o /dev/null -w 'spa      %{http_code}\\n' http://localhost:3000/
curl -s -o /dev/null -w 'web      %{http_code}\\n' http://localhost:3001/
curl -s -o /dev/null -w 'api      %{http_code}\\n' http://localhost:4000/public</pre><div class="check"><b>確認</b><pre class="out">keycloak 200
spa      200
web      200
api      200</pre></div><div class="read"><b>読み方</b><p>4つとも 200。</p><ul><li>200 でないものは、そのプロセスのターミナルを見る(起動し忘れ、ポート使用中、<code>CLIENT_SECRET</code> の指定忘れ)。</li><li>API の起動ログに <code>aud=api-service</code> と出ていること。出ていなければ <code>AUDIENCE</code> の付け忘れで、この章の <code>aud</code> 検査の確認が再現しない。</li><li>ブラウザからは必ず <code>localhost</code>(<code>127.0.0.1</code> ではない)。<code>iss</code> は API の <code>ISSUER</code> と完全一致する必要がある(課題の問6で、ずれた状態を起こす)。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c16-l01-p02', title: `前提の棚卸し: Client・ロール・scope・補助関数を1回で点検する`,
        html: `<p class="goal">やりたいこと: 一周の途中で「前の章で作っていなかった」を踏まないよう、前提をコマンドで棚卸しする。足りないものは、示した章に戻って作る(ここでは作らない)。</p><div class="step"><h4>手順 1　補助関数を読み込む</h4><p>この章で使う <code>call</code>(API をトークン付きで呼ぶ)を足す。</p><pre>source ~/develop/kc-handson/kc-lab.sh
cat &gt;&gt; ~/develop/kc-handson/kc-lab.sh &lt;&lt; 'EOF'
call() { curl -s -w '  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $1" "http://localhost:4000$2"; }
EOF
source ~/develop/kc-handson/kc-lab.sh</pre><div class="check"><b>確認</b><pre class="out">エラーなく終わり、type call で関数として表示される。</pre></div><div class="read"><b>読み方</b><p>第10章で <code>get_token</code> を別の形に定義し直していても、上の <code>source</code> で第2章の定義(トークン応答の JSON を返す版)に戻る。</p></div></div><div class="step"><h4>手順 2　4つの Client の種別を見る</h4><pre>ADM=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=admin -d password=admin | jq -r .access_token)
for c in frontend-spa backend-web api-service batch-job; do
  curl -s -H "Authorization: Bearer $ADM" "http://localhost:8080/admin/realms/demo/clients?clientId=$c" | jq -c '.[0] | {clientId, publicClient, serviceAccountsEnabled}'
done</pre><div class="check"><b>確認</b><pre class="out">{"clientId":"frontend-spa","publicClient":true,"serviceAccountsEnabled":false}
{"clientId":"backend-web","publicClient":false,"serviceAccountsEnabled":false}
{"clientId":"api-service","publicClient":false,"serviceAccountsEnabled":false}
{"clientId":"batch-job","publicClient":false,"serviceAccountsEnabled":true}</pre></div><div class="read"><b>読み方</b><p>4行が出る。</p><p><code>publicClient</code> が true なのは <code>frontend-spa</code> だけ、<code>serviceAccountsEnabled</code> が true なのは <code>batch-job</code> だけなら前提どおり。違えば第6章の Client 作成を見直す。</p></div></div><div class="step"><h4>手順 3　Client Scope orders:read を確かめる</h4><pre>curl -s -H "Authorization: Bearer $ADM" http://localhost:8080/admin/realms/demo/client-scopes | jq -r '.[].name' | grep orders</pre><div class="check"><b>確認</b><pre class="out">orders:read</pre></div><div class="read"><b>読み方</b><p><code>orders:read</code> が出る。</p><p>出なければ第4章に戻って作る。</p></div></div><div class="step"><h4>手順 4　alice のトークンでロール・aud・scope を点検する</h4><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq '{aud, azp, scope, roles: .realm_access.roles}'</pre><div class="check"><b>確認</b><pre class="out">{ "aud": ["api-service","account"], "azp": "frontend-spa", "scope": "openid email profile",
  "roles": ["default-roles-demo", "offline_access", "uma_authorization", "user", "admin"] }</pre></div><div class="read"><b>読み方</b><p><code>aud</code> に <code>api-service</code>、<code>roles</code> に <code>admin</code> がある。</p><ul><li><code>aud</code> に <code>api-service</code> が無い → Audience Mapper が無い(第4章 レッスン4 の「aud=api-service を要求して拒否される」で作ったもの)。</li><li><code>roles</code> に <code>admin</code> が無い → alice に Role を付けていない(第1章 レッスン2)、または Full scope allowed が OFF(第11章)。</li><li><code>scope</code> に <code>orders:read</code> が無いのは正常。Optional な scope は要求したときだけ載る(第4章)。第5レッスンで要求する。</li><li>トークンが取れない(<code>unauthorized_client</code>)→ <code>frontend-spa</code> の Direct access grants(<code>get_token</code> が使う Password Grant)が OFF(第5章)。</li></ul></div></div><div class="step"><h4>手順 5　3つの secret が入っているか確かめる</h4><p>値は表示しない。</p><pre>for v in API_SECRET WEB_SECRET BATCH_SECRET; do [ -n "$(printenv $v)" ] &amp;&amp; echo "$v: set" || echo "$v: EMPTY"; done</pre><div class="check"><b>確認</b><pre class="out">API_SECRET: set
WEB_SECRET: set
BATCH_SECRET: set</pre></div><div class="read"><b>読み方</b><p>3つとも set。</p><p><code>EMPTY</code> の secret は、各 Client の Credentials タブで確認して <code>kc-lab.sh</code> に書き直す(第2・6・9章)。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c16-l02', title: `Step 4 Authorization Code Flow を手動実行`, pages: [
      { id: 'c16-l02-p01', title: `自作 SPA でログインして一周し、取れたトークンを API に渡す`,
        html: `<p class="goal">やりたいこと: 第7章の SPA で、<b>ブラウザ → Keycloak → SPA → API</b> の一周を通す。認可リクエスト・PKCE・code 交換の中身は再説明しない(第7・8章)。「SPA が受け取ったトークンをそのまま自作 API に渡して通る」ことの確認が目的。前提: 4つのプロセスが動いている。</p><div class="step"><h4>手順 1　SPA でログインする</h4><p>シークレットウィンドウ(SSO の Cookie が無い状態。通常のウィンドウだと alice のセッションが残っていてログイン画面が出ないことがある)で <code>http://localhost:3000/</code> を開き、開発者ツールの Network タブで「Preserve log」を On にする。「login」を押し、<code>alice</code> / <code>alice</code> でログインする。</p><div class="check"><b>確認</b><pre class="out">## 1. callback        { "state": "…", "session_state": "…", "iss": "http://localhost:8080/realms/demo", "code": "…" }
## 3. id_token        { "aud": "frontend-spa", "azp": "frontend-spa", "nonce": "…", "preferred_username": "alice", … }
## 4. access_token    { "azp": "frontend-spa", "aud": ["api-service","account"], … }
(Network の token リクエスト)  grant_type=authorization_code, client_id=frontend-spa, code=…, code_verifier=…  ※ client_secret は無い</pre></div><div class="read"><b>読み方</b><p>戻ってきた画面の <code>## 1. callback</code>〜<code>## 4. access_token</code> を読む。Network の <code>token</code> リクエストの Payload も見る。</p><ul><li>画面に claim が出て nonce の照合も通っていれば、ログインと code 交換は成功(第7章)。</li><li>token リクエストに <code>client_secret</code> が無く <code>code_verifier</code> があれば、Public client は PKCE で守られている(第6・7章)。</li><li>ログイン前に <code>Invalid parameter: redirect_uri</code> → <code>frontend-spa</code> の Valid redirect URIs が <code>http://localhost:3000/*</code> でない(第5章)。token リクエストが CORS エラー → Web origins が <code>http://localhost:3000</code> でない。</li></ul></div></div><div class="step"><h4>手順 2　トークンをシェルに写す</h4><p>Console でクリップボードに写し、シェルの変数に入れる(macOS の例。他の OS は貼り付けて代入する)。</p><pre>copy(tokens.access_token)</pre><pre>SPA_AT=$(pbpaste)
echo $SPA_AT | cut -c1-20</pre><div class="check"><b>確認</b><pre class="out">eyJhbGciOiJSUzI1NiIs</pre></div><div class="read"><b>読み方</b><p>先頭 20 文字が出る。</p><p>Console で <code>tokens</code> が <code>undefined</code> なら SPA をリロードした(トークンはメモリだけ)。もう一度 login する。トークンを JS が持っている点が Web アプリ(第4レッスン)との大きな違い。ブラウザから API を直接呼ぶ版(CORS が必要)は第8章 レッスン4 にあるので、ここでは curl で渡す。</p></div></div><div class="step"><h4>手順 3　自作 API をトークンなし・ありで呼ぶ</h4><pre>curl -s -w '  -&gt; HTTP %{http_code}\\n' http://localhost:4000/me
call $SPA_AT /me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"missing bearer token"}  -&gt; HTTP 401
{"sub":"…","preferred_username":"alice","aud":["api-service","account"],"scope":"openid email profile"}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>なしは 401、ありは 200。</p><p>API が Bearer を検証して通した。<code>/me</code> の <code>aud</code> に <code>api-service</code> があるのは Audience Mapper のおかげ(第4章)。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c16-l03', title: `Step 5〜7 トークンを読む・Evaluate・Userinfo`, pages: [
      { id: 'c16-l03-p01', title: `一周したトークンを読み、Evaluate・Userinfo・JWKS と突き合わせる`,
        html: `<p class="goal">やりたいこと: API が通したトークンの<b>どの項目を見て通したのか</b>を、手元のトークン・管理コンソールの Evaluate・Userinfo・JWKS の4か所で突き合わせる。<code>SPA_AT</code> は alice の Access Token(ここでは <code>get_token</code> で取り直す)。</p><div class="step"><h4>手順 1　トークンから API が見る項目を取り出す</h4><pre>source ~/develop/kc-handson/kc-lab.sh
SPA_AT=$(get_token alice | jq -r .access_token)
jwt $SPA_AT | jq '{iss, aud, azp, scope, realm_access: .realm_access.roles}'
jwt $SPA_AT | jq -r '[.iat, .exp] | map(todate) | .[]'
jwt $SPA_AT | jq '.exp - .iat'</pre><div class="check"><b>確認</b><pre class="out">{ "iss": "http://localhost:8080/realms/demo", "aud": ["api-service","account"], "azp": "frontend-spa",
  "scope": "openid email profile", "realm_access": [ "default-roles-demo", …, "admin" ] }
"2026-…T…Z"
"2026-…T…Z"
300</pre></div><div class="read"><b>読み方</b><p>claim と、発行・期限の時刻、差が出る。</p><p><code>exp - iat</code> が 300 なら Access Token の寿命は 5 分(Realm settings → Tokens の既定)。<code>azp</code> は「誰が要求したか」(<code>frontend-spa</code>)、<code>aud</code> は「誰宛か」(<code>api-service</code> と <code>account</code>)で、API が見るのは主に <code>aud</code>(第3・8章)。署名・<code>iss</code>・<code>aud</code>・<code>exp</code> は API が自分で見る項目、ロールと scope は通したあとで認可に使う項目。この区別が、第6レッスンの切り分けの軸になる。</p></div></div><div class="step"><h4>手順 2　ヘッダの kid と JWKS を比べる</h4><pre>jwth $SPA_AT | jq -c '{alg, kid}'
curl -s $OIDC/certs | jq -r '.keys[] | "\\(.kid) \\(.use) \\(.alg)"'</pre><div class="check"><b>確認</b><pre class="out">{"alg":"RS256","kid":"…"}
…(kid) sig RS256
…(kid) enc RSA-OAEP</pre></div><div class="read"><b>読み方</b><p>ヘッダの kid が、JWKS の <code>sig</code> 用の鍵のどれかと一致する。</p><p>一致すれば、API は <code>kid</code> で鍵を選んで署名を検証できる(第8章)。一致しないときは、別の realm のトークン、または鍵をローテーションした後の古いトークン(第14章)。</p></div></div><div class="step"><h4>手順 3　Evaluate と見比べる</h4><p>管理コンソール(<code>admin</code> / <code>admin</code>)で、Clients → <code>frontend-spa</code> → Client scopes タブ → Evaluate サブタブ。Users に <code>alice</code> を入れ、「Generated access token」を開く。</p><div class="check"><b>確認</b><pre class="out">aud・azp・realm_access・scope が手順1の結果と一致する。</pre></div><div class="read"><b>読み方</b><p>一致するなら、Evaluate は「このユーザー・このクライアントで発行されるトークン」のプレビュー。claim が出ない・消えたときの最初の道具になる(課題で使う)。</p></div></div><div class="step"><h4>手順 4　Userinfo を呼ぶ</h4><pre>curl -s -H "Authorization: Bearer $SPA_AT" $OIDC/userinfo | jq</pre><div class="check"><b>確認</b><pre class="out">{ "sub": "…", "preferred_username": "alice", "email_verified": …, … }</pre></div><div class="read"><b>読み方</b><p>ユーザー情報が返る。</p><p>Userinfo は、トークンの中身ではなく Keycloak が持つユーザー情報を返す。トークンに載っていない項目の確認や、有効性の確認に使える(第2章)。期限切れなら 401。</p></div></div><div class="step"><h4>手順 5　API の判定と対応づける</h4><pre>call $SPA_AT /me</pre><div class="check"><b>確認</b><pre class="out">{"sub":"…","preferred_username":"alice","aud":["api-service","account"], …}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>200 で <code>aud</code> などが返る。</p><p>手順1で見た署名・<code>iss</code>・<code>aud</code>・<code>exp</code> がそろっているから通った。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c16-l04', title: `Step 8〜10 Confidential client・Client Credentials`, pages: [
      { id: 'c16-l04-p01', title: `Web アプリ(Confidential)とバッチ(Client Credentials)を、同じ API につなぐ`,
        html: `<p class="goal">やりたいこと: SPA(Public)と同じ API を、<b>secret を持つ2種類のクライアント</b>からも呼ぶ。サーバー側 Web アプリの <code>backend-web</code>(第6章)と、ユーザー不在の <code>batch-job</code>(第9章)で、トークンの出どころ・claim・API での通り方の違いを並べる。</p><div class="step"><h4>手順 1　Web アプリでログインする</h4><p>シークレットウィンドウ(alice の SSO セッションが残っていないように)で <code>http://localhost:3001/</code> を開き、「login」を押して <code>alice</code> / <code>alice</code> でログインする。</p><div class="check"><b>確認</b><pre class="out">(Web アプリの画面)  "access_token": { "azp": "backend-web", … }  ※ トークン本体の文字列も secret も画面に出ない
(Web アプリのターミナル)  token response: 200 [ 'access_token', 'expires_in', 'refresh_expires_in', 'refresh_token', 'token_type', 'id_token', … ]</pre></div><div class="read"><b>読み方</b><p>画面の JSON と、Web アプリのターミナルの出力を読む。</p><ul><li><code>azp</code> が <code>backend-web</code> で、画面に secret もトークン本体も出ていなければ、それらはサーバーの中だけにあり、ブラウザには Cookie のセッション ID だけが渡っている(第6章)。SPA とは「トークンを誰が持つか」が違う。</li><li>Web アプリで <code>unauthorized_client</code>(Invalid client credentials)→ 起動時の <code>CLIENT_SECRET</code> が違う(課題の問5で起こす)。</li></ul></div></div><div class="step"><h4>手順 2　batch-job で Client Credentials のトークンを取る</h4><pre>source ~/develop/kc-handson/kc-lab.sh
R=$(curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials)
echo $R | jq 'keys'
BA=$(echo $R | jq -r .access_token)</pre><div class="check"><b>確認</b><pre class="out">[ "access_token", "expires_in", "not-before-policy", "refresh_expires_in", "scope", "token_type" ]</pre></div><div class="read"><b>読み方</b><p>キーの一覧に <code>refresh_token</code> と <code>id_token</code> が無い。</p><p>ユーザー不在なので、ログインの結果も更新も無い。期限が切れたら、また <code>POST /token</code> するだけ(第9章)。<code>unauthorized_client</code> → Client authentication か Service accounts roles が Off。<code>invalid_client</code> → secret の誤り。</p></div></div><div class="step"><h4>手順 3　SPA とバッチのトークンを比べる</h4><pre>SPA_AT=$(get_token alice | jq -r .access_token)
jwt $SPA_AT | jq -c '{azp, preferred_username}'
jwt $BA | jq -c '{azp, preferred_username, aud}'</pre><div class="check"><b>確認</b><pre class="out">{"azp":"frontend-spa","preferred_username":"alice"}
{"azp":"batch-job","preferred_username":"service-account-batch-job","aud":"account"}</pre></div><div class="read"><b>読み方</b><p>「誰のトークンか」が違う。</p><p><code>preferred_username</code> が <code>service-account-batch-job</code> なのは、クライアントごとに専用のサービスアカウントユーザーがいるから。バッチの <code>aud</code> には <code>api-service</code> がまだ無い。</p></div></div><div class="step"><h4>手順 4　バッチのトークンを API に渡す</h4><pre>call $BA /me</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"aud\\" claim value"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><p><code>aud</code> が合わず 401。</p><p><b>トークンは有効でも、宛先が違えば API は通さない</b>。SPA の <code>aud-api-service</code> は <code>frontend-spa</code> 用の Mapper なので、<code>batch-job</code> には別に必要(第4章)。</p></div></div><div class="step"><h4>手順 5　batch-job に Audience Mapper を足して取り直す</h4><p>Clients → <code>batch-job</code> → Client scopes タブ → <code>batch-job-dedicated</code> → Configure a new mapper → <b>Audience</b>。Name=<code>aud-api-service</code>、Included Client Audience=<code>api-service</code>、Add to access token=On で Save。</p><pre>BA=$(curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | jq -r .access_token)
call $BA /me</pre><div class="check"><b>確認</b><pre class="out">{"sub":"…","preferred_username":"service-account-batch-job","aud":["api-service","account"],"scope":"email profile"}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>200 になり、<code>aud</code> に <code>api-service</code> が入る。</p><p>通れば、足りなかったのは宛先だけ。Mapper を足した後は、必ずトークンを取り直す。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c16-l05', title: `Step 11〜12 Client Role と Mapper`, pages: [
      { id: 'c16-l05-p01', title: `aud・Role・scope の3点で、API の認可を 401 → 403 → 200 に通す`,
        html: `<p class="goal">やりたいこと: API の入口は3段になっている。<b>aud(宛先)→ Role(誰か)→ scope(何をしてよいか)</b>。それぞれが Keycloak のどの設定(Mapper・Role mapping・Client Scope)から来るのかを、alice・bob・batch-job の3者で確かめる。設定そのものは第4・9・11章で作った。</p><div class="step"><h4>手順 1　alice と bob で3つのパスを呼ぶ</h4><p>どちらも <code>frontend-spa</code> のトークン。</p><pre>source ~/develop/kc-handson/kc-lab.sh
AA=$(get_token alice | jq -r .access_token)
BB=$(get_token bob | jq -r .access_token)
for p in /me /admin /orders; do call $AA $p; done
for p in /me /admin /orders; do call $BB $p; done</pre><div class="check"><b>確認</b><pre class="out">(alice, scope=openid)
{"sub":"…","preferred_username":"alice", …}  -&gt; HTTP 200
{"message":"admin ok"}  -&gt; HTTP 200
{"error":"forbidden","reason":"missing scope: orders:read"}  -&gt; HTTP 403
(bob)
{"sub":"…","preferred_username":"bob", …}  -&gt; HTTP 200
{"error":"forbidden","reason":"missing realm role: admin"}  -&gt; HTTP 403
{"error":"forbidden","reason":"missing scope: orders:read"}  -&gt; HTTP 403</pre></div><div class="read"><b>読み方</b><p>alice は <code>/orders</code> だけ 403、bob は <code>/admin</code> と <code>/orders</code> が 403。</p><p><b>401 は「通す相手と認めない」(署名・iss・aud・exp)、403 は「相手は分かったが権限不足」(Role・scope)</b>。<code>/me</code> が 200 なら入口の3項目は通っているので、その先の 403 は Role か scope の不足だけを疑う。bob も <code>/me</code> が 200 なのは、<code>aud-api-service</code> が Role に関係なく <code>aud</code> に足す Mapper だから(第4章)。alice の <code>/admin</code> が 200、bob が 403 なのは <code>realm_access.roles</code> の差(第1・11章)。</p></div></div><div class="step"><h4>手順 2　scope を要求して /orders を通す</h4><p>alice で scope を要求して取り直す(第4章 レッスン1 の Optional scope)。</p><pre>AO=$(get_token alice orders:read | jq -r .access_token)
jwt $AO | jq -r .scope
call $AO /orders</pre><div class="check"><b>確認</b><pre class="out">"openid email profile orders:read"
{"orders":[1,2,3]}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p>scope に <code>orders:read</code> が入り、<code>/orders</code> が 200。</p><p>Optional scope は要求したときだけ載る(第4章)。</p></div></div><div class="step"><h4>手順 3　SPA にも scope を足す</h4><p><code>~/develop/kc-handson/spa/index.html</code> の <code>scope: 'openid'</code> を <code>scope: 'openid orders:read'</code> に変えて保存し、SPA を再読み込みして login し直す。Console で <code>copy(tokens.access_token)</code> → <code>SPA_AT=$(pbpaste)</code> とし、<code>call $SPA_AT /orders</code> を呼ぶ。</p><div class="check"><b>確認</b><pre class="out">/orders が 200。</pre></div><div class="read"><b>読み方</b><p>SPA はコードの <code>scope</code> を変えて、はじめて要求が変わる。変えただけでは古いトークンは変わらないので、login し直す。</p></div></div><div class="step"><h4>手順 4　bob の Evaluate を alice と見比べる</h4><p>Evaluate(Clients → <code>frontend-spa</code> → Client scopes → Evaluate)で、Users に <code>bob</code> を入れて Generated access token を見る。</p><div class="check"><b>確認</b><pre class="out">aud は alice と同じで、realm_access に admin が無い。</pre></div><div class="read"><b>読み方</b><p>手順1の 403 が、トークンの <code>realm_access</code> の差として管理コンソール上でも確かめられる。</p></div></div><div class="step"><h4>手順 5　バッチも同じ表に並べる</h4><p>バッチに権限を付けていれば(第9章 レッスン1)並べる。</p><pre>BA=$(curl -s -X POST $OIDC/token -u batch-job:$BATCH_SECRET -d grant_type=client_credentials | jq -r .access_token)
jwt $BA | jq -c '{scope, roles: .realm_access.roles}'
for p in /me /admin /orders; do call $BA $p; done</pre><div class="check"><b>確認</b><pre class="out">{"scope":"email profile orders:read","roles":["default-roles-demo","admin", …]}
/me 200, /admin 200, /orders 200</pre></div><div class="read"><b>読み方</b><p>admin ロールと <code>orders:read</code> を付けた場合は3つとも 200。</p><ul><li><code>/admin</code> や <code>/orders</code> が 403 → サービスアカウントにロール(Service accounts roles タブ)と scope(Client scopes に Default で追加)を付ける(第9章 レッスン1)。</li><li>付けても反映されない → 発行済みのトークンは変わらないので取り直す。それでも出ないなら Full scope allowed が OFF の可能性(第4・11章)。</li></ul></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c16-l06', title: `Step 13〜15 Refresh・Logout・API 検証・便利機能`, pages: [
      { id: 'c16-l06-p01', title: `Refresh と失効: 「API は通る」のに「Keycloak は無効」という状態を見る`,
        html: `<p class="goal">やりたいこと: トークンの<b>更新(Refresh)と失効</b>を、自作 API のローカル検証と Keycloak の Introspection の両方から見る。ログアウト後もローカル検証の API が 200 を返す理由と、Refresh が失敗する条件を、1本の流れで確かめる(第9章 レッスン2・4、第10章 レッスン2)。</p><div class="step"><h4>手順 1　Refresh Token で取り直す</h4><pre>source ~/develop/kc-handson/kc-lab.sh
T=$(get_token alice)
AT1=$(echo $T | jq -r .access_token); RT1=$(echo $T | jq -r .refresh_token)
jwt $AT1 | jq -c '{jti, sid}'
T2=$(curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT1)
AT2=$(echo $T2 | jq -r .access_token); RT2=$(echo $T2 | jq -r .refresh_token)
jwt $AT2 | jq -c '{jti, sid}'</pre><div class="check"><b>確認</b><pre class="out">{"jti":"aaa…","sid":"S1…"}
{"jti":"bbb…","sid":"S1…"}</pre></div><div class="read"><b>読み方</b><p><code>sid</code> は同じで <code>jti</code> が違う。</p><p>同じログインセッションのまま新しい Access Token が出た。ユーザーの操作は不要(第9章)。</p></div></div><div class="step"><h4>手順 2　Introspection で今も有効か聞く</h4><p>呼ぶ側は <code>api-service</code>。</p><pre>curl -s -X POST $OIDC/token/introspect -u api-service:$API_SECRET -d token=$AT2 | jq -c '{active, preferred_username}'
call $AT2 /me</pre><div class="check"><b>確認</b><pre class="out">{"active":true,"preferred_username":"alice"}
{"sub":"…","preferred_username":"alice", …}  -&gt; HTTP 200</pre></div><div class="read"><b>読み方</b><p><code>active:true</code> で、API も 200。</p><p>Introspection が 401 なら <code>API_SECRET</code> が違う(呼ぶ側も Confidential として認証が必要)。</p></div></div><div class="step"><h4>手順 3　セッションを Sign out してもう一度試す</h4><p>管理コンソールの Sessions で alice のセッションがあることを確かめ(手順2で API・Introspection とも有効だった状態)、その行を「Sign out」する(SPA 側のログアウトは第9章 レッスン4 の RP-Initiated Logout でも同じ結果になる)。同じトークンで、API・Introspection・Refresh を試す。</p><pre>call $AT2 /me
curl -s -X POST $OIDC/token/introspect -u api-service:$API_SECRET -d token=$AT2 | jq -c .
curl -s -X POST $OIDC/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=$RT2 | jq -c .</pre><div class="check"><b>確認</b><pre class="out">{"sub":"…","preferred_username":"alice", …}  -&gt; HTTP 200
{"active":false}
{"error":"invalid_grant","error_description":"Session not active"}</pre></div><div class="read"><b>読み方</b><p>API は 200 のまま、Introspection は <code>active:false</code>、Refresh は <code>invalid_grant</code>。</p><ul><li>API が 200 のままなのは、署名・<code>iss</code>・<code>aud</code>・<code>exp</code> だけを見ていて Keycloak 側の失効に気づけないから。トークンが期限(既定 5 分)で切れるまで通る(第10章)。</li><li><code>active: false</code> は Keycloak がセッション終了を把握している印。即時反映が必要な API は Introspection、性能優先なら Access Token を短命にしてローカル検証、という使い分け(第10章 レッスン2)。</li><li>Refresh の <code>invalid_grant</code>(<code>Session not active</code> または <code>Token is not active</code>)は、土台のセッションが無くなり Refresh Token も使えないということ。アプリは再ログインに戻す。期限切れの 401(<code>ERR_JWT_EXPIRED</code>)からの復帰は「Refresh して1回だけ再試行、それも失敗したら再ログイン」(第9章 レッスン2)。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c16-l06-p02', title: `障害切り分け課題 1/2: ログイン前後・トークンの中身が壊れたら`,
        html: `<p class="goal">やりたいこと: 設定を<b>1つだけ</b>壊し、出た症状から原因を特定する。各問は「壊す操作 → 症状 → どこを見て原因を特定するか」の形。1問ごとに、必ず元に戻してから次に進む。</p><div class="step"><h4>手順 1　準備(正常確認と Events の有効化)</h4><pre>source ~/develop/kc-handson/kc-lab.sh
AT=$(get_token alice | jq -r .access_token)
call $AT /me
call $AT /admin
jwt $AT | jq -c '{aud, roles: .realm_access.roles}'
curl -s -o /dev/null -w '%{http_code}\\n' "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;scope=openid&amp;redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F"</pre><p>管理コンソール Realm settings → Events → User events settings で Save events を On にして Save する(第14章 レッスン2)。</p><div class="check"><b>確認</b><pre class="out">/me と /admin がどちらも 200。
aud に api-service を含み、roles に admin を含む。
認可リクエストの curl は 200(ログイン画面)。</pre></div><div class="read"><b>読み方</b><p>ここが正常な基準(ログインの入口が通り、aud と admin ロールがトークンにあり、API が 200)。以降の症状はこれとの差で読む。</p></div></div><div class="step"><h4>手順 2　問1 Valid redirect URIs を壊す</h4><p>Clients → <code>frontend-spa</code> → Settings の Valid redirect URIs を <code>http://localhost:3000/callback</code> に変えて Save。SPA(<code>http://localhost:3000/</code>)で「login」を押し、次を実行する。</p><pre>curl -s -o /dev/null -w '%{http_code}\\n' "$OIDC/auth?client_id=frontend-spa&amp;response_type=code&amp;scope=openid&amp;redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F"</pre><div class="check"><b>確認</b><pre class="out">ブラウザ: We are sorry... Invalid parameter: redirect_uri  (ログイン画面は出ない)
curl: 400
Events: LOGIN_ERROR の行(error は invalid_redirect_uri、Details に拒否された redirect_uri。表示は Keycloak のバージョンで変わりうる)</pre></div><div class="read"><b>読み方</b><p>症状を見る。左メニュー Events → User events の最新の行も見る。</p><p><code>redirect_uri</code> のエラーが Keycloak の画面に出てアプリに戻ってこないなら、原因は Keycloak 側の Valid redirect URIs と SPA の <code>REDIRECT</code> の不一致(末尾のスラッシュ、ポート、ワイルドカードの有無)。見る順は、(1) エラー画面の文言、(2) アドレスバーの <code>redirect_uri=</code> の値、(3) Valid redirect URIs の登録値(第5章)。Events は、ユーザー向けには曖昧なエラーでも管理者は原因を追える記録(第14章)。確認後、<code>http://localhost:3000/*</code> に戻す。</p></div></div><div class="step"><h4>手順 3　問2 Audience Mapper を壊す</h4><p>Clients → <code>frontend-spa</code> → Client scopes → <code>frontend-spa-dedicated</code> → Mappers の <code>aud-api-service</code> を開き、Add to access token を Off にして Save。トークンを取り直して API を呼ぶ。</p><pre>AT=$(get_token alice | jq -r .access_token)
call $AT /me
jwt $AT | jq -c '{aud, azp, iss}'</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized","reason":"ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"aud\\" claim value"}  -&gt; HTTP 401
{"aud":"account", ...}     (api-service が無い)</pre></div><div class="read"><b>読み方</b><p>ログインは成功するが API は 401。</p><p>ログインは成功し API だけが 401 で <code>aud</code> の理由が出るなら、トークンは有効だが宛先が違う。見る順は、(1) API の <code>reason</code>(<code>aud</code>)、(2) <code>jwt</code> で <code>aud</code> を直接見る、(3) Evaluate(Clients → <code>frontend-spa</code> → Client scopes → Evaluate、Users=<code>alice</code>)の Generated access token の <code>aud</code>、(4) Mapper の Add to access token と、トークンを取り直したか。Evaluate と手元で <code>aud</code> が違うなら手元のトークンが古い(第4章 レッスン4)。確認後、Add to access token を On に戻す。</p></div></div><div class="step"><h4>手順 4　問3 Full scope allowed を壊す</h4><p><code>frontend-spa-dedicated</code> の Scope タブで Full scope allowed を Off にして Save。</p><pre>AT=$(get_token alice | jq -r .access_token)
call $AT /me
call $AT /admin
jwt $AT | jq -c '.realm_access.roles'</pre><div class="check"><b>確認</b><pre class="out">{"error":"forbidden","reason":"missing realm role: admin"}  -&gt; HTTP 403
null    (realm_access ごと無くなり、admin も消える)</pre></div><div class="read"><b>読み方</b><p><code>/me</code> は 200 のまま、<code>/admin</code> だけ 403。Users → alice → Role mapping には <code>admin</code> が残っている。</p><p>Role mapping には <code>admin</code> があるのにトークンの <code>realm_access</code> から消えたなら、「ロールを付けること」と「トークンに載せる許可」は別(第11章 レッスン1)。<code>/me</code> が 200 で <code>/admin</code> だけ 403 なので、認証は通り認可だけが足りない。見る順は、(1) ロールが本人に付いているか、(2) Full scope allowed か Scope タブで許可されているか、(3) Evaluate の <code>realm_access</code>、(4) トークンを取り直したか。確認後、Full scope allowed を On に戻す。</p><p>3問に共通する切り分けの軸は、401 か 403 か(認証か認可か)→ API の <code>reason</code> → トークンのデコード → Evaluate → 管理コンソールの設定。</p></div></div>`,
        oxIds: [] },
      { id: 'c16-l06-p03', title: `障害切り分け課題 2/2: scope・secret・issuer を疑う`,
        html: `<p class="goal">やりたいこと: 課題の後半。壊すのは <code>scope</code>・Client の secret・API の issuer 設定の3つ。症状から原因を特定し、1問ごとに元に戻す。最後に、症状から最初に見る場所を早見表にまとめる。</p><div class="step"><h4>手順 1　問4 Client scope の割り当てを壊す</h4><p>まず scope を要求しないで呼び、次に要求して通ることを確かめる。</p><pre>AT=$(get_token alice | jq -r .access_token)
call $AT /orders
jwt $AT | jq -r .scope</pre><pre>AO=$(get_token alice orders:read | jq -r .access_token)
call $AO /orders</pre><p>そのうえで Clients → <code>frontend-spa</code> → Client scopes タブで <code>orders:read</code> を外し(Remove)、もう一度要求する。</p><pre>get_token alice orders:read | jq -c .</pre><div class="check"><b>確認</b><pre class="out">要求なし: {"error":"forbidden","reason":"missing scope: orders:read"}  -&gt; HTTP 403   (scope は "openid email profile")
要求あり: {"orders":[1,2,3]}  -&gt; HTTP 200
orders:read を外した後: get_token は {"error":"invalid_scope", ...}  → AO は null になり call は 401</pre></div><div class="read"><b>読み方</b><p>症状を見る。</p><p>要求なしの 403 は、認証は通り認可だけが足りない。<code>jwt</code> で <code>scope</code> を読むと <code>orders:read</code> が無い → Optional scope は要求しないと載らない(第4章)。割り当てを外した後は、トークンの問題ではなく Keycloak が scope 自体を許さない(<code>invalid_scope</code>)。見る順は、(1) API の <code>reason</code>(<code>scope</code>)、(2) <code>jwt</code> の <code>scope</code>、(3) リクエストに <code>scope=</code> を付けたか、(4) Client scopes タブの割り当て。確認後、Add client scope で <code>orders:read</code> を Optional で追加し直す。</p></div></div><div class="step"><h4>手順 2　問5 Web アプリの secret を壊す</h4><p>先に、シークレットウィンドウで <code>http://localhost:3001/</code> を開いて「login」を押し、ログインできること(Web アプリのターミナルに <code>token response: 200</code>)を確かめて、ウィンドウを閉じる。次に Clients → <code>backend-web</code> → Credentials タブで Client secret の「Regenerate」を押す(古い secret は即座に無効になる)。Web アプリは再起動せず、新しいシークレットウィンドウで <code>http://localhost:3001/</code> を開いて「login」を押す。</p><div class="check"><b>確認</b><pre class="out">Regenerate 前: Web アプリのターミナル token response: 200
Regenerate 後: Web アプリのターミナル: token response: 401 { error: 'unauthorized_client', error_description: 'Invalid client or Invalid client credentials' }
ブラウザ(Web アプリが返す画面): {"error":"unauthorized_client","error_description":"Invalid client or Invalid client credentials"}</pre></div><div class="read"><b>読み方</b><p>Web アプリを動かしているターミナルの <code>token response:</code> の行と、ブラウザの画面を読む。左メニュー Events → User events も見る。</p><p><code>Invalid client or Invalid client credentials</code> は、クライアント認証の失敗。code や redirect_uri は関係がない(code が正しくても交換できない)。見る順は、(1) Web アプリのターミナルの <code>token response</code> の行、(2) 起動時の <code>CLIENT_SECRET</code> と Credentials タブの値の一致、(3) secret を Regenerate していないか、(4) Events に記録が出ていればその error。確認後、新しい secret を <code>kc-lab.sh</code> の <code>WEB_SECRET</code> に書き、<code>source</code> して、Web アプリを新しい secret で再起動する。</p></div></div><div class="step"><h4>手順 3　問6 API の issuer 設定を壊す</h4><p>まず正常な状態を確認する。</p><pre>AT=$(get_token alice | jq -r .access_token)
call $AT /me</pre><p>200 を確かめたら、API のターミナルで Ctrl+C して、<code>ISSUER</code> を <code>127.0.0.1</code> にして起動し直す。</p><pre>cd ~/develop/kc-handson/api
ISSUER=http://127.0.0.1:8080/realms/demo AUDIENCE=api-service node server.js</pre><p>別のターミナルで、いつもどおり <code>localhost</code> で取ったトークンを渡す。</p><pre>AT=$(get_token alice | jq -r .access_token)
jwt $AT | jq -r .iss
call $AT /me</pre><div class="check"><b>確認</b><pre class="out">(再起動前の call は 200)
"http://localhost:8080/realms/demo"
{"error":"unauthorized","reason":"ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"iss\\" claim value"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><p><code>iss</code> は正しいのに 401。</p><p><code>iss</code> は <code>http://localhost:8080/realms/demo</code> で正しいのに <code>iss</code> の理由で 401 なら、発行元の文字列が API の <code>ISSUER</code>(今回は <code>127.0.0.1</code>)と完全一致していない。署名も <code>exp</code> も正しいのに落ちる点が特徴。見る順は、(1) API の <code>reason</code>(<code>iss</code>)、(2) <code>jwt</code> で <code>iss</code> を読む、(3) API 起動時の <code>ISSUER</code>。直すには <code>ISSUER</code> をトークンの <code>iss</code> と同じにして起動し直す。第1章の <code>KC_HOSTNAME</code> 固定のおかげで、<code>127.0.0.1</code> でトークンを取っても <code>iss</code> は <code>localhost</code> のまま(第2章)。ホスト名を固定していない Keycloak では、トークンを取った URL がそのまま <code>iss</code> になり、同じ症状が起きる。確認後、API を止めて <code>AUDIENCE=api-service node server.js</code>(<code>ISSUER</code> 指定なし)で起動し直す。</p></div></div><div class="step"><h4>手順 4　症状から最初に見る場所をまとめる</h4><table><tr><th>症状</th><th>最初に見る場所</th></tr><tr><td>Keycloak の画面にエラー(<code>redirect_uri</code>、<code>client</code>)</td><td>エラー画面の文言、アドレスバーの URL、Client の Settings、Events</td></tr><tr><td>API が 401(<code>reason</code> に <code>aud</code>・<code>iss</code>・署名・<code>exp</code>)</td><td>API の <code>reason</code> → <code>jwt</code> でデコード → Evaluate</td></tr><tr><td>API が 403(<code>reason</code> に role・scope)</td><td><code>jwt</code> の <code>realm_access</code>・<code>scope</code> → Evaluate → Role mapping・Full scope allowed・Client scopes</td></tr><tr><td>token リクエストが <code>unauthorized_client</code>・<code>invalid_client</code></td><td>Client authentication、許可フロー、secret、Web アプリ・バッチのログ</td></tr><tr><td>設定を直したのに変わらない</td><td>トークンを取り直したか(発行済みのトークンは変わらない)</td></tr></table><div class="check"><b>確認</b><pre class="out">この章で触った設定が元に戻っているかを、次で確かめる。get_token alice で取ったトークンで call /me と call /admin が 200、シークレットウィンドウで SPA(http://localhost:3000/)と Web アプリ(http://localhost:3001/)のログインが通る。</pre></div><div class="read"><b>読み方</b><p>棚卸しと SPA ログインが通れば元通り。通らない箇所は、上の表の行から見る場所を選ぶ。</p></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
// 第17章 トラブルシューティング・用語集・学習リソース (ハンズオン形式)
DATA.chapters.push({
  no: 17, title: `トラブルシューティング・用語集・学習リソース`,
  lessons: [
    { id: 'c17-l01', title: `エラー早見表`, pages: [
      { id: 'c17-l01-p01', title: `認可・トークンまわりのエラーをわざと起こす`,
        html: `<p class="goal">やりたいこと: エラーは「見たことがあるか」で解決の速さが決まる。よくあるエラー(redirect_uri・client・grant)をわざと起こして、メッセージと原因の対応を体に入れ、直して成功させる。</p><div class="step"><h4>手順 1　Invalid parameter: redirect_uri を起こす</h4><p>登録していない redirect_uri で認可リクエストを出す。</p><pre>curl -s -i "http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=frontend-spa&amp;response_type=code&amp;scope=openid&amp;redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F" | head -n 1
curl -s -i "http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=frontend-spa&amp;response_type=code&amp;scope=openid&amp;redirect_uri=http%3A%2F%2Flocalhost%3A9999%2Fcb" | head -n 1</pre><div class="check"><b>確認</b><pre class="out">1 つ目(登録済みパターンに合う URL)は 200(ログイン画面)、2 つ目は 400。</pre></div><div class="read"><b>読み方</b><p><code>Invalid parameter: redirect_uri</code>(400)は Valid redirect URIs の不一致。Clients → 該当 Client → Settings の Valid redirect URIs に、末尾のスラッシュ・ポート・http/https まで含めて合わせる。1 つ目が通るのは <code>http://localhost:3000/*</code> に合うから。</p></div></div><div class="step"><h4>手順 2　unauthorized_client を起こす</h4><p>Public client で Client Credentials を試す。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d client_id=frontend-spa -d grant_type=client_credentials | jq .</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized_client", ...}</pre></div><div class="read"><b>読み方</b><p><code>unauthorized_client</code> が返る。</p><p><code>unauthorized_client</code> は「その Client に、その方法(grant)を使う資格が無い」。Public client で Client Credentials、Client authentication=ON なのに secret が無い・違う、フローが OFF(例: Direct access grants が OFF で Password Grant)のときに出る。Client の Capability config と secret を確認する。</p></div></div><div class="step"><h4>手順 3　secret を間違える</h4><p>Confidential client(<code>backend-web</code> など)で secret を間違える。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -u backend-web:wrong -d grant_type=client_credentials | jq .</pre><div class="check"><b>確認</b><pre class="out">{"error":"unauthorized_client","error_description":"Invalid client or Invalid client credentials"}</pre></div><div class="read"><b>読み方</b><p>メッセージを見る。</p><p>secret の誤りは <code>unauthorized_client</code> / <code>Invalid client credentials</code>。Credentials タブの値と一致させる。</p></div></div><div class="step"><h4>手順 4　存在しない client_id を使う</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d client_id=no-such-client -d grant_type=password -d username=alice -d password=alice | jq .</pre><div class="check"><b>確認</b><pre class="out">{"error":"invalid_client","error_description":"Invalid client or Invalid client credentials"}</pre></div><div class="read"><b>読み方</b><p><code>invalid_client</code> が返る。</p><p><code>invalid_client</code> は client_id そのものの誤り(綴り・realm 違い)。error_description は secret 誤りのときと同じ文言になることがある。</p></div></div><div class="step"><h4>手順 5　でたらめな code と Refresh Token を送る</h4><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d grant_type=authorization_code -d client_id=frontend-spa -d redirect_uri=http://localhost:3000/ -d code=dummy | jq .
curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token=dummy | jq .</pre><div class="check"><b>確認</b><pre class="out">{"error":"invalid_grant","error_description":"Code not valid"} / {"error":"invalid_grant","error_description":"Invalid refresh token"}</pre></div><div class="read"><b>読み方</b><p>どちらも <code>invalid_grant</code>。</p><p><code>invalid_grant</code> は「渡した code / Refresh Token / パスワードが受け付けられない」。理由は <code>error_description</code> で読み分ける。</p><ul><li><b>Code not valid</b>: 期限切れ・使い回し</li><li><b>Incorrect redirect_uri</b>: token リクエストの redirect_uri が認可リクエストと違う</li><li><b>PKCE verification failed</b>: verifier が違う</li><li><b>Invalid refresh token</b>: Refresh Token が不正</li><li><b>Session not active</b>: セッション終了。再ログイン</li><li><b>Invalid user credentials</b>: パスワード違い</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c17-l01-p02', title: `scope・アカウント・パス・CORS・HTTPS のエラーを起こす`,
        html: `<p class="goal">やりたいこと: 残りの定番エラー(<code>invalid_scope</code>、アカウントの状態、URL の間違い、CORS、HTTPS 必須)を、わざと起こして原因を確かめる。</p><div class="step"><h4>手順 1　invalid_scope を起こす</h4><p>存在しない scope を要求する。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice -d scope="openid no-such-scope" | jq .</pre><div class="check"><b>確認</b><pre class="out">{"error":"invalid_scope", ...}</pre></div><div class="read"><b>読み方</b><p><code>invalid_scope</code> が返る。</p><p>存在しない、または Client に割り当てていない scope。Clients → Client scopes に割り当てる、または綴りを直す。</p></div></div><div class="step"><h4>手順 2　404 を起こす</h4><p>realm 名を間違える、古い <code>/auth</code> パスを使う。</p><pre>curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/realms/demoo/.well-known/openid-configuration
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/auth/realms/demo/.well-known/openid-configuration</pre><div class="check"><b>確認</b><pre class="out">404 / 404</pre></div><div class="read"><b>読み方</b><p>2 つとも 404。</p><p>realm 名の綴り、または URL のパスの誤り。今の Keycloak の URL に <code>/auth</code> は付かない。</p></div></div><div class="step"><h4>手順 3　アカウントを無効にする</h4><p>先に、有効な状態で bob がログインできることを確かめる。次に Users → <code>bob</code> の Enabled を OFF にして、同じ curl を実行する。確認後 ON に戻す。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d client_id=frontend-spa -d grant_type=password -d username=bob -d password=bob | jq .</pre><div class="check"><b>確認</b><pre class="out">Enabled ON: access_token を含む JSON が返る
Enabled OFF: {"error":"invalid_grant","error_description":"Account disabled"}</pre></div><div class="read"><b>読み方</b><p><code>Account disabled</code> が返る。</p><p>パスワードが合っていても、Enabled が OFF なら <code>invalid_grant</code>。Users 画面の Enabled を見る。</p></div></div><div class="step"><h4>手順 4　Required action を残す</h4><p>Users → <code>bob</code> に Required user actions の <code>Update Password</code> を付けて、次の curl(Direct Grant)でログインを試す。</p><pre>curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d client_id=frontend-spa -d grant_type=password -d username=bob -d password=bob | jq .</pre><p>確認後、Required user actions を外す。</p><div class="check"><b>確認</b><pre class="out">{"error":"invalid_grant","error_description":"Account is not fully set up"}</pre></div><div class="read"><b>読み方</b><p><code>Account is not fully set up</code> が返る。</p><p>Required action が残っている、または必須の Email・氏名が空。Users 画面で Required user actions と必須項目を確認する。</p></div></div><div class="step"><h4>手順 5　CORS を起こす</h4><p>Clients → <code>frontend-spa</code> の Web origins を空にして Save し、実際のトークン要求に Origin を付けて送る。送る前に、現在の設定(<code>http://localhost:3000</code>)でも一度送って基準にする。最後に <code>http://localhost:3000</code> に戻して、もう一度送る。(OPTIONS のプリフライトは Client を特定できないため、Web origins に関係なく <code>access-control-allow-origin</code> が付く実測だった。判定には使えない。)</p><pre>curl -s -i -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -H 'Origin: http://localhost:3000' -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice | grep -i '^access-control-allow-origin'</pre><div class="check"><b>確認</b><pre class="out">現在の設定: access-control-allow-origin: http://localhost:3000 が出る / Web origins 空: access-control-allow-origin が出ない / 設定後: access-control-allow-origin: http://localhost:3000</pre></div><div class="read"><b>読み方</b><p>最初は出ていたヘッダが、Web origins が空だと出なくなり、設定後はまた出る。</p><p>CORS のエラーは、ブラウザの SPA が Keycloak を直接呼ぶときに起きる。Web origins に SPA の origin(スキーム + ホスト + ポート、パス無し)が入っていないと、ヘッダが付かずブラウザが遮断する。</p></div></div><div class="step"><h4>手順 6　HTTPS required を起こす</h4><p>Realm settings の General にある Require SSL を、すべての通信に HTTPS を要求する設定(<code>All requests</code>)にして、HTTP でトークンを取る。確認後 <code>External requests</code> に戻す(第14章)。</p><div class="check"><b>確認</b><pre class="out">{"error":"invalid_request","error_description":"HTTPS required"}</pre></div><div class="read"><b>読み方</b><p><code>HTTPS required</code> が返る。</p><p>Require SSL の設定に対して HTTP で来た、ということ。本番は HTTPS にする(<code>none</code> は開発のみ)。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c17-l02', title: `API側で401・claim が出ない`, pages: [
      { id: 'c17-l02-p01', title: `API 側で 401 になる原因を切り分ける`,
        html: `<p class="goal">やりたいこと: API が 401 を返す原因は、<code>iss</code>・<code>aud</code>・<code>exp</code>・署名の 4 つに絞れる。第10章の自作 API は理由を JSON で返す。残りの定番、<b>iss の不一致</b>(<code>localhost</code> と別のホスト名)をわざと起こし、切り分けの順を確認する。</p><div class="step"><h4>手順 1　issuer をずらして API を起動する</h4><p>API のターミナルで Ctrl+C してから、issuer を <code>127.0.0.1</code> にずらし、audience 検査つきで起動する。</p><pre>cd ~/develop/kc-handson/api &amp;&amp; ISSUER=http://127.0.0.1:8080/realms/demo AUDIENCE=api-service node server.js</pre><div class="check"><b>確認</b><pre class="out">起動ログに issuer と aud=api-service が出る。</pre></div><div class="read"><b>読み方</b><p>出なければ環境変数の付け忘れ。</p></div></div><div class="step"><h4>手順 2　localhost と 127.0.0.1 でトークンを取って渡す</h4><pre>jwtd() { cut -d. -f2 | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq .; }
for h in localhost 127.0.0.1; do
  T=$(curl -s -X POST http://$h:8080/realms/demo/protocol/openid-connect/token \\
    -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice -d scope=openid | jq -r .access_token)
  echo "== $h"; echo $T | jwtd | jq -r .iss
  curl -s -w '  -&gt; HTTP %{http_code}\\n' -H "Authorization: Bearer $T" http://localhost:4000/me
done</pre><div class="check"><b>確認</b><pre class="out">== localhost
http://localhost:8080/realms/demo
{"error":"unauthorized","reason":"ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"iss\\" claim value"}  -&gt; HTTP 401
== 127.0.0.1
http://localhost:8080/realms/demo
{"error":"unauthorized","reason":"ERR_JWT_CLAIM_VALIDATION_FAILED: unexpected \\"iss\\" claim value"}  -&gt; HTTP 401</pre></div><div class="read"><b>読み方</b><p>どちらも <code>iss</code> は <code>localhost</code> で、どちらも 401。</p><ul><li><code>iss</code> の文字列が 1 文字でも API の <code>ISSUER</code> と違えば拒否される。第1章で <code>KC_HOSTNAME</code> を固定しているので、127.0.0.1 で取ってもトークンの <code>iss</code> は <code>localhost</code> のまま変わらない(実測)。この lab で iss 不一致を起こすには API 側の <code>ISSUER</code> をずらす。確認後、<code>ISSUER</code> 指定なしで起動し直すと両方 200 になる。</li><li><code>KC_HOSTNAME</code> を固定していない Keycloak では、アクセスしたホスト名がそのまま <code>iss</code> になりうるので、取得元と API の設定を揃える(この lab では未確認)。</li><li>Docker 内の API が <code>http://keycloak:8080</code> で Keycloak を呼ぶ構成では、<code>iss</code>(ブラウザが使った <code>localhost:8080</code>)と API が期待する issuer がずれやすい。外向きの URL を一つに固定する(<code>KC_HOSTNAME</code>、または Frontend URL)のが定番の解決策。</li></ul></div></div><div class="step"><h4>手順 3　reason から原因に当てはめる</h4><p>失敗したトークンの <code>reason</code> を、次の表で原因に当てはめる。</p><table><tr><th>reason</th><th>原因</th><th>直し方</th></tr><tr><td><code>unexpected "iss" claim value</code></td><td>トークンの <code>iss</code> と API の <code>ISSUER</code> が違う</td><td>URL のホスト名を統一。Keycloak 側はホスト名の設定(<code>KC_HOSTNAME</code> / Realm settings の Frontend URL)</td></tr><tr><td><code>unexpected "aud" claim value</code></td><td>トークンに API の名前が無い</td><td>Audience Mapper か Client Role を付与</td></tr><tr><td><code>ERR_JWT_EXPIRED</code></td><td>期限切れ、または時計のずれ</td><td>トークンを取り直す。Refresh Token で更新。時刻を合わせる</td></tr><tr><td><code>ERR_JWS_SIGNATURE_VERIFICATION_FAILED</code> / <code>ERR_JWKS_NO_MATCHING_KEY</code></td><td>署名が合わない、鍵が見つからない(鍵ローテーション後に古い JWKS)</td><td>JWKS を取り直す(<code>kid</code> が見つからないとき再取得する実装に)</td></tr></table><div class="check"><b>確認</b><pre class="out">手順2の reason は表の1行目に当たる。</pre></div><div class="read"><b>読み方</b><p>切り分けの順は <b>iss → aud → exp → 署名</b>。どれでもなければ、トークンの <code>exp</code> と現在時刻、Keycloak と API の時刻ずれを見る。</p></div></div>`,
        oxIds: [] },
      { id: 'c17-l02-p02', title: `claim が出ないときの確認項目を、1 つずつ壊して確かめる`,
        html: `<p class="goal">やりたいこと: 「claim が出ない」は原因が複数ある。claim を 1 つ作り、原因を 1 つずつ再現して Evaluate で確認し、確認の順番を身につける。</p><div class="step"><h4>手順 1　Client scope と Hardcoded claim を作る</h4><p>Client scopes → Create client scope。Name=<code>dept-scope</code>、Type=<code>None</code>、Protocol=OpenID Connect → Save。<code>dept-scope</code> → Mappers タブ → Configure a new mapper → <b>Hardcoded claim</b>。Name=<code>dept-fixed</code>、Token Claim Name=<code>dept</code>、Claim value=<code>sales</code>、Claim JSON type=<code>String</code>、Add to access token=ON → Save。</p><div class="check"><b>確認</b><pre class="out">dept-scope の Mappers に dept-fixed がある。</pre></div><div class="read"><b>読み方</b><p>claim を作る部品(Mapper)ができただけで、まだどの Client にも割り当てていない。</p></div></div><div class="step"><h4>手順 2　原因1 割り当て無し</h4><p>Clients → <code>frontend-spa</code> → Client scopes タブ → Evaluate で Generated access token を見る。</p><div class="check"><b>確認</b><pre class="out">dept が無い。</pre></div><div class="read"><b>読み方</b><p>Mapper があっても、その Client Scope が Client に割り当てられていなければ載らない。</p></div></div><div class="step"><h4>手順 3　原因2 Optional なのに要求しない</h4><p>Client scopes タブ → Add client scope → <code>dept-scope</code> を <b>Optional</b> で追加。Evaluate の Scope parameter 欄に何も選ばずに見て、次に Scope parameter で <code>dept-scope</code> を選んで見る。</p><div class="check"><b>確認</b><pre class="out">選ばないと dept が無く、選ぶと "dept": "sales" が出る。</pre></div><div class="read"><b>読み方</b><p>Optional は <code>scope=</code> で要求したときだけ載る。</p></div></div><div class="step"><h4>手順 4　原因3 Mapper の Add to access token が OFF</h4><p><code>dept-fixed</code> の Add to access token を OFF にして Evaluate(scope 指定あり)。確認後 ON に戻す。</p><div class="check"><b>確認</b><pre class="out">dept が消える。</pre></div><div class="read"><b>読み方</b><p>Mapper は、目的のトークン(Access / ID / userinfo)向けの ON が要る。</p></div></div><div class="step"><h4>手順 5　原因4 Default にすれば要求しなくても載る</h4><p><code>dept-scope</code> を Default に付け替えて、Scope parameter 無しで Evaluate。</p><div class="check"><b>確認</b><pre class="out">"dept": "sales" が出る。</pre></div><div class="read"><b>読み方</b><p>Default なら <code>scope=</code> に書かなくても載る。</p></div></div><div class="step"><h4>手順 6　原因5 Lightweight Access Token</h4><p><code>frontend-spa</code> の Advanced タブで、<b>lightweight</b> という語を含む項目を探して ON にして Save し、Evaluate する。見つからなければこの項目は読むだけでよい。確認後 OFF に戻す。</p><div class="check"><b>確認</b><pre class="out">多くの claim(dept を含む)が Access Token から省かれる。</pre></div><div class="read"><b>読み方</b><p>「claim が出ない」の確認順は次のとおり。</p><ul><li>(1) その claim を作る <b>Mapper</b> があるか、Add to access token / ID token / userinfo が目的のトークン向けに ON か。</li><li>(2) その Mapper を持つ <b>Client Scope が Client に割り当て</b>されているか。</li><li>(3) <b>Optional</b> なのに <code>scope=</code> に書いていないか(Default なら書かなくても載る)。</li><li>(4) ロール系なら <b>Full scope allowed</b> が OFF でないか。</li><li>(5) User Attribute 系なら、属性名の綴りと、値が入っているか。</li><li>(6) <b>Lightweight Access Token</b> で省略されていないか。</li></ul><p>Evaluate には出るのに実トークンに無いなら、トークンを取り直したか、<code>scope</code> の要求と Client の設定が実際のログインと同じかを疑う。</p></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c17-l03', title: `用語集`, pages: [
      { id: 'c17-l03-p01', title: `用語集(1) 認証・認可の基本を実物で見つける`,
        html: `<p class="goal">やりたいこと: 認証・認可まわりの基本用語を、Keycloak の画面と応答の中で実物を見つけながら確かめる。言葉の定義より先に「どこにあるか」を知る。各手順の「確認」は実物を探す場所、「読み方」はその用語の意味。</p><div class="step"><h4>手順 1　issuer(IdP)を見つける</h4><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{issuer}'</pre><div class="check"><b>確認</b><pre class="out">{ "issuer": "http://localhost:8080/realms/demo" }</pre></div><div class="read"><b>読み方</b><p>Discovery の <code>issuer</code> を見る。</p><p><b>IdP(Identity Provider)</b>は認証を担当する側で、<code>issuer</code> の Keycloak(realm <code>demo</code>)がそれ。</p></div></div><div class="step"><h4>手順 2　管理コンソールのメニューで認証と認可を見つける</h4><p>左メニューを順に開く。Users(ログインする人)、Sessions(SSO のセッション)、Authentication(ログイン手順と MFA)、Clients(ログインを任せてくる側のアプリ)。</p><div class="check"><b>確認</b><pre class="out">Clients 一覧: account, frontend-spa, ...</pre></div><div class="read"><b>読み方</b><p>Clients 一覧に <code>account</code>・<code>frontend-spa</code> などが並ぶ。</p><ul><li><b>認証(Authentication)</b>は「あなたは誰?」(ログイン)、<b>認可(Authorization)</b>は「あなたは何をしてよい?」(ロール・scope で決まる)。Authentication メニューは前者の手順、Users の Role mapping は後者の材料。</li><li><b>SP / RP</b>はログインを IdP に任せる側で、Clients 一覧に並ぶアプリ。</li><li><b>MFA</b>はパスワード + ワンタイムコードなど複数の要素。Authentication の Flow と、Users の Credentials タブ(OTP)で見つかる(第12章)。</li></ul></div></div><div class="step"><h4>手順 3　SSO を体験する</h4><p>シークレットウィンドウ(SSO の Cookie が無い状態)で http://localhost:8080/realms/demo/account を開いてログインし、続けて同じウィンドウの別のタブで同じ URL を開く。</p><div class="check"><b>確認</b><pre class="out">2 回目はログイン画面なしで入れる。管理コンソールの Sessions に 1 件のセッションが見える。</pre></div><div class="read"><b>読み方</b><p><b>SSO</b>は一度ログインすれば、複数のアプリで再ログイン不要になること。入力なしで入れたのがそれ。</p></div></div>`,
        oxIds: [] },
      { id: 'c17-l03-p02', title: `用語集(2) OAuth / OIDC を Discovery で見つける`,
        html: `<p class="goal">やりたいこと: OAuth / OIDC の用語を、Discovery(<code>.well-known/openid-configuration</code>)の項目と、実際の認可 URL の中に見つける。「確認」は実物を探す場所、「読み方」はその用語の意味。</p><div class="step"><h4>手順 1　Discovery から grant・scope・PKCE 方式を見つける</h4><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{grant_types_supported, response_types_supported, scopes_supported, code_challenge_methods_supported}'</pre><div class="check"><b>確認</b><pre class="out">grant_types_supported: authorization_code, client_credentials, implicit, password, refresh_token と、urn:ietf:params:oauth:grant-type:device_code / token-exchange / uma-ticket、urn:openid:params:grant-type:ciba など
scopes_supported: openid, profile, email, roles, ...
code_challenge_methods_supported: plain, S256</pre></div><div class="read"><b>読み方</b><p>サポートされる項目の一覧が出る。</p><ul><li><b>OAuth 2.0</b>は認可の標準(アプリに、ユーザーの代わりに API を使う権限を渡す)。<b>OIDC</b>はそれに「ユーザーが誰か」(ID Token)を足したもので、scope に <code>openid</code> が入ると OIDC になる。</li><li><b>Grant Type</b>はトークンの取り方で、<code>grant_types_supported</code> の一覧そのもの。<b>Scope</b>は要求する範囲(スペース区切り)。<b>Claim</b>はトークンに入っている 1 つの情報。</li><li><b>PKCE</b>は <code>code_challenge</code> と <code>code_verifier</code> で code の横取りを防ぐ仕組み(<code>code_challenge_methods_supported</code> に S256)。</li></ul></div></div><div class="step"><h4>手順 2　認可 URL のパラメータを数える</h4><p>認可リクエストの URL を 1 つ組み立てて、パラメータの名前を数える。</p><pre>echo "http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&amp;scope=openid%20profile&amp;state=abc&amp;nonce=n1&amp;code_challenge=xxxx&amp;code_challenge_method=S256"</pre><div class="check"><b>確認</b><pre class="out">client_id, response_type, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method</pre></div><div class="read"><b>読み方</b><p>パラメータは 8 個。</p><ul><li><b>redirect_uri</b>はログイン後に戻す先。<b>state</b>は CSRF 対策の往復値。<b>nonce</b>は ID Token のリプレイ防止。</li><li><b>Confidential / Public client</b>は secret を安全に持てる / 持てない(Clients の Client authentication で決まる)。<b>BFF</b>は SPA の代わりにサーバー側がトークンを扱う構成(第16章の Web アプリがその形)。<b>Bearer Token</b>は持っている人が使えるトークンで、盗まれると悪用される。</li></ul></div></div>`,
        oxIds: [] },
      { id: 'c17-l03-p03', title: `用語集(3) トークン関連を実物で見つける`,
        html: `<p class="goal">やりたいこと: トークンまわりの用語(JWT・JWKS・kid・Introspection・Revocation・Offline Token など)を、トークンの実物と Discovery から見つける。「確認」は実物を探す場所、「読み方」はその用語の意味。</p><div class="step"><h4>手順 1　トークンの header と payload を見る</h4><pre>TOKEN=$(curl -s -X POST http://localhost:8080/realms/demo/protocol/openid-connect/token -d client_id=frontend-spa -d grant_type=password -d username=alice -d password=alice -d scope="openid offline_access" | tee /tmp/t.json | jq -r .access_token)
echo $TOKEN | cut -d. -f1,2 | tr '.' '\\n' | while read p; do echo $p | tr '_-' '/+' | awk '{ while (length($0) % 4) $0 = $0 "="; print }' | base64 -d 2&gt;/dev/null | jq -c '{alg, typ, kid, iss, acr, scope}'; done</pre><div class="check"><b>確認</b><pre class="out">{"alg":"RS256","typ":"JWT","kid":"...","iss":null,"acr":null,"scope":null}
{"alg":null,"typ":"Bearer","kid":null,"iss":"http://localhost:8080/realms/demo","acr":null,"scope":"openid email offline_access profile ..."}</pre></div><div class="read"><b>読み方</b><p>1 行目が header、2 行目が payload。</p><ul><li><b>JWT</b>は <code>header.payload.signature</code> 形式の署名付きトークン(JWS が署名版、JWE が暗号化版)。header の <code>alg</code>(署名方式)と、payload の claim が見えた。</li><li><b>kid</b>はどの鍵で署名したかの ID。</li><li><b>ACR</b>は認証の強さのレベル。ブラウザでログインしたトークンには <code>"acr": "1"</code> が付くが、Password Grant で取った上のトークンには無く <code>null</code> になる。<b>AMR</b>は使われた認証方法(<code>pwd</code>・<code>otp</code> など。既定のトークンでは確認できなかった)。</li><li><b>Sender-constrained Token</b>は、DPoP や mTLS でトークンを持ち主に紐づけ、盗まれても使えなくしたもの。</li></ul></div></div><div class="step"><h4>手順 2　JWKS・Introspection・Revocation の URL を見つける</h4><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq '{jwks_uri, introspection_endpoint, revocation_endpoint}'</pre><div class="check"><b>確認</b><pre class="out">{ "jwks_uri": ".../certs", "introspection_endpoint": ".../token/introspect", "revocation_endpoint": ".../revoke" }</pre></div><div class="read"><b>読み方</b><p>3 つの URL が出る。</p><p><b>JWKS</b>は署名検証用の公開鍵一覧(<code>jwks_uri</code>)で、API は <code>kid</code> で鍵を選ぶ。<b>Introspection</b>はトークンが有効かサーバーに問い合わせること。<b>Revocation</b>はトークンを失効させること(<code>revocation_endpoint</code>)。</p></div></div><div class="step"><h4>手順 3　Offline Token の寿命を見る</h4><p><code>offline_access</code> を要求したので Offline Token になっている。</p><pre>jq '{refresh_expires_in}' /tmp/t.json</pre><div class="check"><b>確認</b><pre class="out">{ "refresh_expires_in": 0 }</pre></div><div class="read"><b>読み方</b><p><code>refresh_expires_in</code> が 0。</p><p><b>Offline Token</b>は、<code>offline_access</code> を要求して得る、ユーザーが不在でも長く使える Refresh Token。<code>refresh_expires_in</code> が 0 と表示され、Refresh Token の <code>typ</code> は <code>Offline</code>。通常の Refresh Token は 1800 秒。</p></div></div>`,
        oxIds: [] },
      { id: 'c17-l03-p04', title: `用語集(4) Keycloak 固有の用語と規格を管理コンソールで見つける`,
        html: `<p class="goal">やりたいこと: Keycloak 固有の用語と関連する規格(OAuth 2.1・SAML 2.0・LDAP)を、管理コンソールのメニューの中に見つけ、用語と画面を 1 対 1 で結びつける。「確認」は実物を探す場所、「読み方」はその用語の意味。</p><div class="step"><h4>手順 1　左メニューを順に開く</h4><p>Clients、Client scopes、Realm roles、Users、Groups、Sessions、Events、Authentication、Identity providers、User federation、Realm settings を上から順に開き、各画面のタイトルを確認する。</p><div class="check"><b>確認</b><pre class="out">Clients / Client scopes / Realm roles / Users / Groups / Sessions / Events / Authentication / Identity providers / User federation / Realm settings</pre></div><div class="read"><b>読み方</b><p>左メニューに次の項目が並ぶ。</p><ul><li><b>Realm</b>はユーザーや設定を隔離する管理単位(左上の切替)。<b>Client</b>は Keycloak に登録するアプリ / API(Clients)。<b>Client Scope</b>はトークンに載せる情報のセット(Client scopes)。</li><li><b>Authentication Flow</b>はログイン手順の定義(Authentication)。<b>Identity Brokering</b>は外部 IdP にログインを任せること(Identity providers)。<b>User Federation</b>は LDAP / AD など既存の名簿を直接読むこと(User federation)。</li><li><b>SPI</b>は Java で Keycloak を拡張する仕組み。<b>Infinispan</b>は Keycloak 内蔵の分散キャッシュ(複数台でセッションを共有)。</li></ul></div></div><div class="step"><h4>手順 2　Client type の選択肢を見る</h4><p>Clients → Create client の <b>Client type</b> のプルダウンを開く(作成せずに戻る)。</p><div class="check"><b>確認</b><pre class="out">Client type: OpenID Connect / SAML</pre></div><div class="read"><b>読み方</b><p>選択肢を見る。</p><p><b>SAML 2.0</b>は XML ベースの SSO 規格で、Client type の SAML がそれ。<b>LDAP</b>はディレクトリへのアクセス規格(User federation)。<b>OAuth 2.1</b>は Implicit と Password Grant を廃止し PKCE を必須にした OAuth 2.0 の整理版(策定中)。</p></div></div><div class="step"><h4>手順 3　Mapper とロールを見つける</h4><p>Client scopes → <code>roles</code> → Mappers で、claim を作る部品を見る。Users → <code>alice</code> の Role mapping と Credentials も見る。</p><div class="check"><b>確認</b><pre class="out">roles に Mapper が並び、alice にロールが付いている。</pre></div><div class="read"><b>読み方</b><ul><li><b>Protocol Mapper</b>は claim を作る部品(Client scopes や Client の Mappers)。</li><li><b>Realm Role / Client Role / Composite Role</b>は realm 共通 / Client 専用 / 束ねたロール(Realm roles、Client の Roles)。</li><li><b>Service Account</b>は Client Credentials 用の自動作成ユーザー。<b>Required Action</b>は次回ログイン時にやらせる作業(Users の Required user actions)。</li></ul></div></div>`,
        oxIds: [] }
    ] },
    { id: 'c17-l04', title: `学習リソース`, pages: [
      { id: 'c17-l04-p01', title: `学習リソース`,
        html: `<p class="goal">やりたいこと: ここから先の調べ物の入口をまとめる。迷ったらまず、実物の Discovery を見る。「確認」は探す場所、「読み方」はその使いどころ。</p><div class="step"><h4>手順 1　自分の Keycloak の Discovery を開く</h4><p>すべての URL の一覧になっている。</p><pre>curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | jq .</pre><div class="check"><b>確認</b><pre class="out">JSON に各エンドポイントの URL と対応機能が並ぶ。</pre></div><div class="read"><b>読み方</b><p>その realm で使える機能の一覧。公式ドキュメントの説明と見比べると、設定の意味が分かる。</p></div></div><div class="step"><h4>手順 2　公式ドキュメントを開く</h4><p><code>https://www.keycloak.org/documentation</code> の Server Administration Guide と Securing Applications を開く。</p><div class="check"><b>確認</b><pre class="out">上の 2 つのガイドが見つかる。</pre></div><div class="read"><b>読み方</b><p>設定項目の意味は Server Administration Guide、アプリ側の組み込みは Securing Applications で調べる。</p></div></div><div class="step"><h4>手順 3　必要になったら規格を参照する</h4><pre>RFC 6749  OAuth 2.0
RFC 7636  PKCE
RFC 7519  JWT
RFC 7662  Introspection
RFC 8628  Device Grant
RFC 8693  Token Exchange
OpenID Connect Core 1.0</pre><div class="check"><b>確認</b><pre class="out">上の規格名で検索すると原文が見つかる。</pre></div><div class="read"><b>読み方</b><p>道具は、ブラウザの JWT デコーダ(学習用トークンのみ)、Postman、<code>curl</code> + <code>jq</code>(この教材で使ってきたもの)、oidcdebugger.com。困ったら、第17章の「わざと起こして直す」と、Events・Evaluate(第16章)に戻る。</p></div></div>`,
        oxIds: [] }
    ] }
  ],
  ox: [], mc: []
});
