// Keycloak 大全集 data part 5: 章 16〜17
DATA.chapters.push({
  no: 16, title: `手を動かす(ハンズオン)`,
  lessons: [
    { id: 'c16-l01', title: `ゴールと準備・Step 0〜3`, pages: [
      { id: 'c16-l01-p01', title: `この章のゴールと登場人物`,
        html: `<p>この章では、第8章の <b class="key">Authorization Code Flow (PKCE)</b> と第9章の <b class="key">Client Credentials Flow</b> を、自分の手で1ステップずつ実行する。各ステップは「やること」「期待する結果」「うまくいかないとき」の順で整理されている。</p><h4>前提</h4><ul><li>Docker、<code>curl</code>、<code>jq</code>、<code>openssl</code> が使えること(Mac は <code>brew install jq</code> で jq が入る)</li></ul><h4>この章で作るもの</h4><table><tr><th>名前</th><th>種別</th><th>ポイント</th></tr><tr><td><code>myrealm</code></td><td>realm</td><td>この章の実験場</td></tr><tr><td><code>taro</code> / <code>pass1234</code></td><td>ユーザー</td><td>ログインする人</td></tr><tr><td><code>frontend-spa</code></td><td>Public client</td><td>Client authentication <b class="key">OFF</b></td></tr><tr><td><code>backend-web</code></td><td>Confidential client</td><td>Client authentication <b class="key">ON</b></td></tr><tr><td><code>backend-api</code></td><td>API 用 client</td><td>Client Role <code>read</code> を持つ</td></tr><tr><td><code>batch-job</code></td><td>バッチ用 client</td><td>ON + Service accounts</td></tr></table><p>Public は OFF、Confidential は ON という対応を頭に置いておくと、後のステップで両者の挙動の差がはっきり見える。</p>`,
        oxIds: ['c16-ox-01'] },
      { id: 'c16-l01-p02', title: `Step 0 Keycloak を起動する`,
        html: `<p>最初に Docker で Keycloak を開発モード(<code>start-dev</code>)で起動する。</p><h4>やること</h4><pre>docker run --rm --name kc -p 8080:8080 \\
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \\
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \\
  quay.io/keycloak/keycloak:26.0 start-dev</pre><h4>期待する結果</h4><ul><li>ログに <code>Keycloak 26.x.x ... started</code> と出る(初回は1〜2分)</li><li><code>http://localhost:8080</code> を開くとログイン画面が出る。<code>admin</code> / <code>admin</code> で入る</li></ul><h4>うまくいかないとき</h4><ul><li>ポート 8080 が使用中なら <code>-p 8081:8080</code> に変え、以降の URL も 8081 に読み替える</li><li>旧バージョンでは変数名が <code>KEYCLOAK_ADMIN</code> / <code>KEYCLOAK_ADMIN_PASSWORD</code></li></ul><p>止めるときは <code>docker stop kc</code>。<code>--rm</code> を付けているので、<span class="trap">止めると設定は消える</span>(学習用なので問題ない)。</p>`,
        oxIds: ['c16-ox-02'] },
      { id: 'c16-l01-p03', title: `Step 1〜2 Realm とユーザー taro を作る`,
        html: `<h4>Step 1. Realm を作る</h4><ul><li>画面左上の「Keycloak」(現在の realm 名 <code>master</code>)のドロップダウンを開き、「Create realm」→ Realm name に <code>myrealm</code> → Create</li><li>左上の表示が <code>myrealm</code> に変われば成功</li></ul><p>確認として Discovery を取得する。</p><pre>curl -s http://localhost:8080/realms/myrealm/.well-known/openid-configuration | jq '.issuer, .token_endpoint'</pre><p><code>"http://localhost:8080/realms/myrealm"</code> が表示されれば成功。この issuer が、後でトークンの <b class="key">iss</b> になる値である。</p><h4>Step 2. ユーザー taro を作る</h4><ol><li>左メニュー Users → Add user</li><li>Username=<code>taro</code>、Email=<code>taro@example.com</code>、First name=<code>Taro</code>、Last name=<code>Yamada</code> → Create</li><li>Credentials タブ → Set password → <code>pass1234</code> を入力し、<b class="key">Temporary を OFF</b> にして Save</li></ol><span class="trap">Temporary が ON のままだと、初回ログインでパスワード変更を求められて流れが止まる。email や名前が空だと <code>Account is not fully set up</code> と出ることもある。</span>`,
        oxIds: ['c16-ox-03', 'c16-ox-04'] },
      { id: 'c16-l01-p04', title: `Step 3 Public client frontend-spa を作る`,
        html: `<p>ブラウザで動く SPA を想定した <b class="key">Public client</b> を作る。</p><h4>やること</h4><ol><li>Clients → Create client</li><li>General settings: Client type=<code>OpenID Connect</code>、Client ID=<code>frontend-spa</code> → Next</li><li>Capability config: <b class="key">Client authentication = OFF</b>、Authentication flow は <b class="key">Standard flow だけ ON</b>(他は OFF) → Next</li><li>Login settings: Valid redirect URIs=<code>http://localhost:3000/callback</code>、Web origins=<code>http://localhost:3000</code> → Save</li></ol><h4>期待する結果</h4><ul><li>Clients 一覧に <code>frontend-spa</code> が出る</li><li><b class="key">Credentials タブは表示されない</b>。これが Public である証拠</li></ul><h4>ポイント</h4><p><code>http://localhost:3000</code> では何も動かさなくてよい。ここでは「ログイン後にブラウザを戻してよい URL」として登録しているだけで、理由は次の Step 4 で分かる。</p>`,
        oxIds: ['c16-ox-05', 'c16-ox-06'] }
    ] },
    { id: 'c16-l02', title: `Step 4 Authorization Code Flow を手動実行`, pages: [
      { id: 'c16-l02-p01', title: `Step 4-1 PKCE の値を作る`,
        html: `<p>Step 4 の目的は、第8章の Authorization Code Flow の手順 1〜8 を、アプリの代わりに自分でやること。まず PKCE の値をターミナルで作る。</p><pre>CODE_VERIFIER=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-64)
CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
echo "verifier : $CODE_VERIFIER"
echo "challenge: $CODE_CHALLENGE"</pre><h4>2つの値の役割</h4><ul><li><b class="key">code_verifier</b> = アプリだけが知る秘密の乱数</li><li><b class="key">code_challenge</b> = その verifier のハッシュ。<b class="key">これだけ</b>を Keycloak に先に渡す</li></ul><p>verifier を最後のトークン交換まで手元に残しておくことで、code を横取りされても交換できないようにするのが PKCE の狙いである。</p><span class="trap">同じターミナルを閉じない。変数が消えると、後で code を token に交換できなくなる。</span>`,
        oxIds: ['c16-ox-07', 'c16-ox-08'] },
      { id: 'c16-l02-p02', title: `Step 4-2〜4-3 認可URLを開いてログインする`,
        html: `<h4>4-2. 認可 URL を作って表示する</h4><pre>echo "http://localhost:8080/realms/myrealm/protocol/openid-connect/auth?client_id=frontend-spa&amp;response_type=code&amp;redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&amp;scope=openid%20profile%20email&amp;state=abc123&amp;nonce=n-0S6_WzA2Mj&amp;code_challenge=$CODE_CHALLENGE&amp;code_challenge_method=S256"</pre><p>出力された URL を<b class="key">ブラウザのアドレスバーに貼って開く</b>。</p><h4>4-3. ブラウザでログインする</h4><ul><li>ログイン画面で <code>taro</code> / <code>pass1234</code> を入力する</li><li>成功すると、ブラウザが <code>http://localhost:3000/callback?...</code> に移動する</li><li>ページは「接続できません」等のエラーになるが、<b class="key">これで正常</b>(そこに何も動いていないため)</li></ul><p>大事なのは<b class="key">アドレスバーの URL</b>で、次のような形になっている。</p><pre>http://localhost:3000/callback?state=abc123&amp;session_state=1b2c...&amp;iss=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fmyrealm&amp;code=7a3f9c1e-....-....</pre><ul><li><code>state=abc123</code> が送った値と一致することを確認する(CSRF 対策の照合を手でやっている)</li><li><code>code=</code> の値(<code>&amp;</code> の手前まで)をコピーする</li></ul>`,
        oxIds: ['c16-ox-09', 'c16-ox-10'] },
      { id: 'c16-l02-p03', title: `Step 4-4 code を token に交換する`,
        html: `<p>コピーした code を、<b class="key">60秒以内</b>にバックチャネルで token に交換する。</p><pre>CODE='ここに code= の値を貼る'
curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -d grant_type=authorization_code \\
  -d client_id=frontend-spa \\
  -d redirect_uri=http://localhost:3000/callback \\
  -d code="$CODE" \\
  -d code_verifier="$CODE_VERIFIER" | tee /tmp/tokens.json | jq 'keys'</pre><h4>見てほしい点</h4><ul><li>frontend-spa は Public なので、<b class="key">client secret は送らない</b>。代わりに 4-1 で作った <code>code_verifier</code> を送る</li><li>code の寿命は約1分(Realm settings → Tokens → Access Code Lifespan)。遅いと失敗する</li></ul><h4>期待する結果</h4><pre>["access_token","expires_in","id_token","not-before-policy","refresh_expires_in","refresh_token","scope","session_state","token_type"]</pre><p>レスポンスは <code>/tmp/tokens.json</code> に保存されるので、以降のステップで使い回す。</p>`,
        oxIds: ['c16-ox-11', 'c16-ox-12'] },
      { id: 'c16-l02-p04', title: `Step 4 うまくいかないとき`,
        html: `<p>Step 4 でよく出るエラーと原因・対処を整理する。</p><table><tr><th>エラー</th><th>原因</th><th>対処</th></tr><tr><td><code>invalid_grant</code> / "Code not valid"</td><td>code の期限切れ、または2回目の使用</td><td><b class="key">4-2 からやり直す</b></td></tr><tr><td><code>invalid_grant</code> / "PKCE verification failed"</td><td>CODE_VERIFIER を別ターミナルで作り直した等で、challenge と合わない</td><td>4-1 からやり直す</td></tr><tr><td><code>Invalid parameter: redirect_uri</code></td><td>Step 3 の Valid redirect URIs と不一致</td><td>登録値と URL を揃える</td></tr><tr><td><code>Invalid client</code></td><td>client_id のスペルミス</td><td>client_id を直す</td></tr></table><span class="trap">code は使い捨て。失敗した同じ code で 4-4 を再実行しても通らない。新しい code を取るため 4-2 から戻る。</span>`,
        oxIds: ['c16-ox-13'] }
    ] },
    { id: 'c16-l03', title: `Step 5〜7 トークンを読む・Evaluate・Userinfo`, pages: [
      { id: 'c16-l03-p01', title: `Step 5 Access Token を decode する`,
        html: `<p>Step 4 で手に入れた Access Token の中身を、コマンドで読んでみる。</p><pre>jq -r .access_token /tmp/tokens.json | cut -d. -f2 | tr '_-' '/+' | base64 -d 2&gt;/dev/null | jq .</pre><h4>何をしているか</h4><ul><li>JWT は <code>header.payload.signature</code> の3つのパートから成る</li><li><code>cut -d. -f2</code> で<b class="key">2番目(payload)</b>を取り出し、<b class="key">Base64URL</b> をデコードしている</li><li><code>tr '_-' '/+'</code> は Base64URL の文字を通常の Base64 の文字に戻す変換</li></ul><span class="trap">末尾の <code>=</code> が足りず base64 がエラーになることがある。その場合は https://jwt.io に貼るのが手軽(ただし貼るのは学習用トークンだけにする)。</span>`,
        oxIds: ['c16-ox-14'] },
      { id: 'c16-l03-p02', title: `Step 5 見るポイント(Access Token と ID Token)`,
        html: `<p>decode した Access Token で、第3章で学んだ claim を確認する。</p><table><tr><th>claim</th><th>この実験での値</th></tr><tr><td><code>iss</code></td><td><code>http://localhost:8080/realms/myrealm</code></td></tr><tr><td><code>sub</code></td><td>taro の UUID(Users 画面の ID と同じ)</td></tr><tr><td><code>azp</code></td><td><code>frontend-spa</code>(要求者)</td></tr><tr><td><code>aud</code></td><td><code>account</code></td></tr><tr><td><code>exp - iat</code></td><td>300(5分)</td></tr><tr><td><code>preferred_username</code></td><td><code>taro</code></td></tr><tr><td><code>scope</code></td><td><code>openid profile email</code></td></tr></table><p><b class="key">aud が account</b> なのは、まだ API 向けの設定をしていないため。後の Step 11 で変化を見る。</p><h4>ID Token も確認する</h4><p>ID Token も同様に decode し、<code>aud</code> が <code>frontend-spa</code>、<code>nonce</code> が認可 URL で送った <code>n-0S6_WzA2Mj</code> になっているのを確認する。Access Token の <code>aud</code> と ID Token の <code>aud</code> は、宛先が違うので値も違う。</p>`,
        oxIds: ['c16-ox-15', 'c16-ox-16'] },
      { id: 'c16-l03-p03', title: `Step 6〜7 Evaluate と Userinfo`,
        html: `<h4>Step 6. 管理画面の Evaluate</h4><ul><li>Clients → <code>frontend-spa</code> → Client scopes タブ → <b class="key">Evaluate</b> サブタブ</li><li>Users に <code>taro</code> を入力して選択し、「Generated access token」をクリック</li></ul><p>Step 5 とほぼ同じ内容の JSON が表示される。<b class="key">ログインせずに</b>、設定変更後のトークン内容を事前に確認できるのが利点で、以降の Mapper 実験で使う。</p><h4>Step 7. Userinfo を呼ぶ</h4><pre>AT=$(jq -r .access_token /tmp/tokens.json)
curl -s http://localhost:8080/realms/myrealm/protocol/openid-connect/userinfo -H "Authorization: Bearer $AT" | jq .</pre><p>Access Token を <code>Authorization: Bearer</code> で渡すと、<code>sub</code>、<code>preferred_username</code>、<code>email</code> などが返る。</p><span class="trap">Introspection は呼び出し側の認証が必要なので、Step 8 で client を作った後に行う。</span>`,
        oxIds: ['c16-ox-17', 'c16-ox-18'] }
    ] },
    { id: 'c16-l04', title: `Step 8〜10 Confidential client・Client Credentials`, pages: [
      { id: 'c16-l04-p01', title: `Step 8 backend-web と backend-api を作る`,
        html: `<h4>backend-web(ログインさせる側)</h4><ol><li>Clients → Create client → Client ID=<code>backend-web</code></li><li>Capability config: <b class="key">Client authentication = ON</b>、Standard flow ON</li><li>Valid redirect URIs=<code>http://localhost:3000/callback</code> → Save</li><li>Credentials タブで <b class="key">Client secret</b> をコピーする(以降 <code>SECRET</code> と呼ぶ)</li></ol><h4>backend-api(トークンを受け取る側)</h4><ol><li>Clients → Create client → Client ID=<code>backend-api</code></li><li>Capability config: <b class="key">Client authentication = ON</b>、フローはすべて OFF → Save</li><li>Credentials タブで secret をコピーする(<code>API_SECRET</code>)</li><li>Roles タブ → Create role → Role name=<code>read</code> → Save</li></ol><p>backend-api を ON にするのは、<b class="key">Introspection で使う secret</b> を取るため。ログインは担当しないのでフローは使わない。</p><p>確認: Credentials タブがあるのは <code>backend-web</code> と <code>backend-api</code>(= ON)で、<code>frontend-spa</code> には無い。</p>`,
        oxIds: ['c16-ox-19'] },
      { id: 'c16-l04-p02', title: `Step 8 Introspection で Access Token を検査する`,
        html: `<p>Step 7 では後回しにした Introspection を、<code>backend-api</code> として呼ぶ。検査対象は Step 4 で取った Access Token。</p><pre>curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token/introspect \\
  -u 'backend-api:API_SECRET' -d token="$AT" | jq '{active, sub, aud, azp, scope}'</pre><h4>結果の読み方</h4><ul><li><code>-u 'backend-api:API_SECRET'</code> は、<b class="key">呼び出し側(backend-api)の認証</b>。Userinfo と違い、誰が問い合わせているかを Keycloak が確かめる</li><li>有効なトークンなら <code>active: true</code> が返る</li><li>5分(<code>expires_in</code>)後に同じ呼び出しをすると <code>{"active": false}</code> になる</li></ul><p>Introspection は、トークンが今も有効かをサーバー側に問い合わせる仕組みである。有効期限が切れたトークンは <code>active: false</code> と判定される。</p>`,
        oxIds: ['c16-ox-20'] },
      { id: 'c16-l04-p03', title: `Step 9 Confidential client で Auth Code を実行する`,
        html: `<p>Step 4 を <code>backend-web</code> で繰り返し、Public との違いを体験する。</p><h4>変更点</h4><ul><li>4-2 の URL の <code>client_id=frontend-spa</code> を <code>backend-web</code> に変える</li><li><code>code_challenge</code> 関連の2つのパラメータを外す(PKCE は省略してもよい)</li><li>4-3 で code を取り、4-4 の交換リクエストを次のように変える</li></ul><pre>curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -u 'backend-web:SECRET' \\
  -d grant_type=authorization_code \\
  -d redirect_uri=http://localhost:3000/callback \\
  -d code="$CODE" | jq 'keys'</pre><h4>体験すること</h4><ul><li><code>-u 'backend-web:SECRET'</code> を外してみる → <code>unauthorized_client</code> / "Invalid client or Invalid client credentials"</li><li>frontend-spa は secret なしで通ったが、backend-web は secret が必須。これが <b class="key">Client authentication の ON / OFF の違い</b>(第6章)</li></ul>`,
        oxIds: ['c16-ox-21', 'c16-ox-22'] },
      { id: 'c16-l04-p04', title: `Step 10 Client Credentials Flow を試す`,
        html: `<h4>client の用意</h4><ol><li>Clients → Create client → Client ID=<code>batch-job</code></li><li>Capability config: <b class="key">Client authentication = ON</b>、<b class="key">Service accounts roles = ON</b>、Standard flow は OFF → Save</li><li>Credentials タブで secret をコピーする(<code>BATCH_SECRET</code>)</li></ol><h4>実行</h4><pre>curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -u 'batch-job:BATCH_SECRET' -d grant_type=client_credentials | jq 'keys'</pre><p>結果には <code>access_token</code> はあるが、<b class="key">refresh_token と id_token は無い</b>。ユーザーが関与しないフローなので ID Token は出ない。decode すると、<code>preferred_username</code> は <code>service-account-batch-job</code>、<code>sub</code> は Users 画面の同名ユーザーの ID、<code>azp</code> は <code>batch-job</code> になっている。</p><h4>比較実験</h4><pre>curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -d client_id=frontend-spa -d grant_type=client_credentials | jq .</pre><span class="trap">Public の frontend-spa では <code>unauthorized_client</code> になる。Client Credentials は Public では使えない。</span>`,
        oxIds: ['c16-ox-23', 'c16-ox-24'] }
    ] },
    { id: 'c16-l05', title: `Step 11〜12 Client Role と Mapper`, pages: [
      { id: 'c16-l05-p01', title: `Step 11 Client Role を付けて aud と resource_access を見る`,
        html: `<h4>やること</h4><ol><li>Users → <code>taro</code> → Role mapping タブ → Assign role</li><li>フィルタを「Filter by clients」にして、<code>backend-api</code> の <code>read</code> を選択 → Assign</li><li>Step 4 を <code>frontend-spa</code> で再実行して新しい Access Token を取得する</li></ol><span class="trap">古いトークンは変わらない。ロールを付けたら必ずトークンを取り直す。</span><h4>期待する結果</h4><ul><li><code>aud</code> に <code>backend-api</code> が増える(<code>roles</code> スコープの <b class="key">Audience Resolve</b> が働いた)</li><li><code>resource_access</code> に次の内容が入る</li></ul><pre>"resource_access": { "backend-api": { "roles": ["read"] } }</pre><p>確認は Step 6 の Evaluate でも可能で、その場合は取り直し不要。</p><h4>変化しないとき</h4><p><b class="key">Full scope allowed</b> が OFF だとロールが絞られる。Clients → <code>frontend-spa</code> → Client scopes → <code>frontend-spa-dedicated</code> → Scope タブで <code>read</code> を許可する。</p>`,
        oxIds: ['c16-ox-25', 'c16-ox-26'] },
      { id: 'c16-l05-p02', title: `Step 12-1 User Attribute Mapper で dept を出す`,
        html: `<p>ユーザーの属性を claim としてトークンに載せる Mapper を自分で作る。</p><h4>手順</h4><ol><li>Users → <code>taro</code> → Attributes タブ → Key=<code>department</code>、Value=<code>sales</code> → Save</li><li>Clients → <code>frontend-spa</code> → Client scopes → <code>frontend-spa-dedicated</code> → Configure a new mapper → <b class="key">User Attribute</b></li><li>Name=<code>dept</code>、User Attribute=<code>department</code>、Token Claim Name=<code>dept</code>、Claim JSON type=<code>String</code>、Add to access token=ON → Save</li><li>Evaluate で Generated access token を見て、<code>"dept": "sales"</code> が出れば成功</li></ol><h4>2つの名前の違い</h4><ul><li><b class="key">User Attribute</b> = 読み取り元。Users 画面の属性キー(<code>department</code>)</li><li><b class="key">Token Claim Name</b> = 書き出し先。トークンに出る claim 名(<code>dept</code>)</li></ul><span class="trap">Attributes タブが無い場合は、Realm settings → User profile で「Unmanaged attributes」を有効にする。</span>`,
        oxIds: ['c16-ox-27', 'c16-ox-28'] },
      { id: 'c16-l05-p03', title: `Step 12-2〜12-3 Audience Mapper と OFF 実験`,
        html: `<h4>12-2. Audience Mapper(固定で aud を追加)</h4><ol><li>同じ dedicated scope に <b class="key">Audience</b> Mapper を追加する</li><li>Included Client Audience=<code>backend-api</code>、Add to access token=ON → Save</li><li>Step 11 で付けたロールを外しても、<code>aud</code> に <code>backend-api</code> が残ることを Evaluate で確認する</li></ol><p>Step 11 の aud 追加はロール(Audience Resolve)由来だったが、Audience Mapper は<b class="key">ロールとは無関係に固定で</b> aud を足す。aud を足す経路が2つあることが分かる。</p><h4>12-3. わざと OFF にして挙動を見る</h4><ul><li><code>dept</code> Mapper の「Add to access token」を OFF にする</li><li>Evaluate で <code>dept</code> が<b class="key">消える</b>ことを確認する</li></ul><p>これが「claim が出ない」ときの最初の確認項目(第17章)の体感になる。設定を変えて Evaluate で結果を見る、という動かし方を身につけるのがこの実験のねらいである。</p>`,
        oxIds: ['c16-ox-29'] }
    ] },
    { id: 'c16-l06', title: `Step 13〜15 Refresh・Logout・API 検証・便利機能`, pages: [
      { id: 'c16-l06-p01', title: `Step 13 Refresh Token でトークンを更新する`,
        html: `<h4>やること</h4><pre>RT=$(jq -r .refresh_token /tmp/tokens.json)
curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token="$RT" | jq 'keys'</pre><p>新しい <code>access_token</code> と <code>refresh_token</code> が返る(<code>/tmp/tokens.json</code> を上書きしてもよい)。Public の frontend-spa なので、ここでも secret は付けない。</p><h4>実験: Rotation の効果</h4><ol><li>Realm settings → Tokens →「<b class="key">Revoke Refresh Token</b>」を ON にして保存</li><li>もう一度 Step 4 でトークンを取り直す</li><li>同じ <code>refresh_token</code> を<b class="key">2回</b>使う</li></ol><p>2回目は <code>invalid_grant</code> になる。Refresh Token が<b class="key">使い捨て</b>になる(Rotation)ためで、盗まれた古い Refresh Token が使い回されることを防げる。</p>`,
        oxIds: ['c16-ox-30', 'c16-ox-31'] },
      { id: 'c16-l06-p02', title: `Step 14 Logout を試す`,
        html: `<p>ブラウザで logout の URL を開く。<code>id_token_hint</code> には Step 4 で得た<b class="key">ID Token</b>を入れる。</p><pre>IDT=$(jq -r .id_token /tmp/tokens.json)
echo "http://localhost:8080/realms/myrealm/protocol/openid-connect/logout?id_token_hint=$IDT&amp;post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F"</pre><span class="trap"><code>post_logout_redirect_uri</code> を使うには、frontend-spa の <b class="key">Valid post logout redirect URIs</b> に <code>http://localhost:3000/</code> を登録しておく必要がある。Valid redirect URIs とは別の設定欄である。</span><h4>確認</h4><ul><li>もう一度 Step 4-2 の URL を開くと、ログイン画面が再び出る。<b class="key">SSO セッションが終わっている</b>ため</li><li>古い Refresh Token で更新すると <code>invalid_grant</code>(「Session not active」)になる</li></ul><p>logout で Keycloak 側のセッションが終了するので、そのセッションに紐づく Refresh Token も使えなくなる。</p>`,
        oxIds: ['c16-ox-32', 'c16-ox-33'] },
      { id: 'c16-l06-p03', title: `Step 15 API を作ってトークンを検証する`,
        html: `<p>発展編。最小の FastAPI(PyJWT)で、トークンを検証する API を作る。</p><pre># pip install fastapi uvicorn "pyjwt[crypto]"
import jwt
from fastapi import FastAPI, Header, HTTPException

ISS = "http://localhost:8080/realms/myrealm"
jwks = jwt.PyJWKClient(f"{ISS}/protocol/openid-connect/certs")
app = FastAPI()

@app.get("/items")
def items(authorization: str = Header(...)):
    token = authorization.removeprefix("Bearer ")
    try:
        key = jwks.get_signing_key_from_jwt(token).key
        claims = jwt.decode(token, key, algorithms=["RS256"],
                            issuer=ISS, audience="backend-api")
    except jwt.PyJWTError as e:
        raise HTTPException(401, str(e))
    if "read" not in claims.get("resource_access", {}).get("backend-api", {}).get("roles", []):
        raise HTTPException(403, "need role: read")
    return {"user": claims["preferred_username"], "items": [1, 2, 3]}</pre><p>起動と呼び出しは <code>uvicorn app:app --port 9000</code> と <code>curl -i localhost:9000/items -H "Authorization: Bearer $AT"</code> である。</p><h4>わざと壊して確認する(第10章のチェックリスト)</h4><ul><li>Step 11 の前のトークン → <code>aud</code> が合わず <b class="key">401</b></li><li>ロール <code>read</code> を外したトークン → <b class="key">403</b></li><li>トークンの末尾1文字を変える → 署名エラーで 401</li><li>5分以上経ったトークン → <code>Signature has expired</code> で 401</li></ul>`,
        oxIds: ['c16-ox-34', 'c16-ox-35'] },
      { id: 'c16-l06-p04', title: `管理画面の便利機能`,
        html: `<p>困ったときに頼れる管理画面の機能を整理する。</p><table><tr><th>機能</th><th>場所</th><th>できること</th></tr><tr><td><b class="key">Evaluate</b></td><td>Clients → Client scopes</td><td>実際に発行されるトークンの内容を確認する</td></tr><tr><td><b class="key">Sessions</b></td><td>左メニュー</td><td>現在ログイン中のセッション一覧。Sign out で強制終了できる</td></tr><tr><td><b class="key">Events</b></td><td>Realm settings → Events</td><td>Save events を ON にすると、ログイン失敗の理由(<code>invalid_redirect_uri</code> など)が見える</td></tr><tr><td><b class="key">Partial export</b></td><td>Realm settings → Action</td><td>設定を JSON で書き出す</td></tr></table><p>「トークンの中身が想定と違う」なら Evaluate、「ログインに失敗する」なら Events、のように症状で使い分けるとよい。</p>`,
        oxIds: ['c16-ox-36'] }
    ] }
  ],
  ox: [
    { id: 'c16-ox-01', text: `この章で作る <code>frontend-spa</code> は Confidential client で、Client authentication は ON である。`, answer: false, explain: `<code>frontend-spa</code> は <b class="key">Public client</b> で、Client authentication は <b class="key">OFF</b>。ON なのは Confidential client の <code>backend-web</code> などである。`, lesson: 'c16-l01' },
    { id: 'c16-ox-02', text: `Step 0 で <code>--rm</code> 付きで起動したコンテナを <code>docker stop</code> すると、作った realm やユーザーの設定は消える。`, answer: true, explain: `<code>--rm</code> 付きなので、止めるとコンテナごと消え、<b class="key">設定も消える</b>。学習用なので問題ない。`, lesson: 'c16-l01' },
    { id: 'c16-ox-03', text: `Step 2 でパスワードの Temporary を ON のままにすると、初回ログインでパスワード変更を求められ、手順が止まる。`, answer: true, explain: `Temporary が ON だと初回ログインで<b class="key">パスワード変更を要求される</b>ため、Step 4 の流れが止まる。OFF にして保存する。`, lesson: 'c16-l01' },
    { id: 'c16-ox-04', text: `Step 1 の確認で Discovery が返す issuer の値 <code>http://localhost:8080/realms/myrealm</code> は、後でトークンの <code>aud</code> に入る値である。`, answer: false, explain: `この issuer が入るのは <code>aud</code> ではなく <b class="key">iss</b>。<code>aud</code> は宛先で、Step 5 では <code>account</code> になっている。`, lesson: 'c16-l01' },
    { id: 'c16-ox-05', text: `<code>frontend-spa</code> に Credentials タブが表示されないのは、Public(Client authentication OFF)である証拠である。`, answer: true, explain: `secret を持たない <b class="key">Public client</b> には Credentials タブが出ない。ON の <code>backend-web</code> などには出る。`, lesson: 'c16-l01' },
    { id: 'c16-ox-06', text: `Step 3 では <code>http://localhost:3000</code> でアプリを動かしておかないと、Valid redirect URIs の登録ができない。`, answer: false, explain: `redirect URI は<b class="key">戻り先 URL を登録するだけ</b>で、そこで何かを動かす必要はない。実際に Step 4 でも、callback ページはエラー表示になるのが正常である。`, lesson: 'c16-l01' },
    { id: 'c16-ox-07', text: `<code>code_verifier</code> は Keycloak に先に渡し、<code>code_challenge</code> は最後のトークン交換まで手元に秘密にしておく。`, answer: false, explain: `逆である。先に Keycloak に渡すのは<b class="key">ハッシュである code_challenge</b>で、秘密の乱数 <b class="key">code_verifier</b> は最後のトークン交換まで手元に置く。`, lesson: 'c16-l02' },
    { id: 'c16-ox-08', text: `4-1 のあと、同じターミナルを閉じて変数が消えると、後で code を token に交換できなくなる。`, answer: true, explain: `交換には 4-1 で作った <b class="key">code_verifier</b> が必要で、変数が消えると challenge と合う値を送れなくなる。`, lesson: 'c16-l02' },
    { id: 'c16-ox-09', text: `ログイン後にブラウザが「接続できません」というエラー画面になったら、手順に失敗している。`, answer: false, explain: `<code>localhost:3000</code> では何も動いていないので、エラー画面になるのが<b class="key">正常</b>。大事なのはアドレスバーの URL に <code>state</code> と <code>code</code> が入っていること。`, lesson: 'c16-l02' },
    { id: 'c16-ox-10', text: `callback の URL の <code>state</code> が送った値 <code>abc123</code> と一致するか確認するのは、CSRF 対策の照合を手でやっていることになる。`, answer: true, explain: `<b class="key">state</b> は CSRF 対策で、送った値が戻ってきたかを照合する。本来はアプリがやる確認を手で行っている。`, lesson: 'c16-l02' },
    { id: 'c16-ox-11', text: `4-4 の token リクエストで、<code>frontend-spa</code> は client secret を送らず、代わりに <code>code_verifier</code> を送る。`, answer: true, explain: `Public client なので secret は無く、<b class="key">code_verifier</b> を送って、最初に渡した challenge との対応を Keycloak に確認させる。`, lesson: 'c16-l02' },
    { id: 'c16-ox-12', text: `code の寿命は約1時間なので、4-3 から 4-4 までゆっくり作業してもよい。`, answer: false, explain: `code の寿命は<b class="key">約1分</b>(Access Code Lifespan)。遅いと失敗するので、60秒以内に交換する。`, lesson: 'c16-l02' },
    { id: 'c16-ox-13', text: `"Code not valid" が出たら、同じ code を使って 4-4 だけをもう一度実行すればよい。`, answer: false, explain: `code は<b class="key">使い捨て</b>で、期限切れか2回目の使用が原因。<b class="key">4-2 からやり直して</b>新しい code を取る必要がある。`, lesson: 'c16-l02' },
    { id: 'c16-ox-14', text: `Step 5 のコマンドで decode しているのは、JWT の2番目のパート(payload)である。`, answer: true, explain: `<code>cut -d. -f2</code> で <b class="key">payload</b> を取り出し、Base64URL をデコードしている。`, lesson: 'c16-l03' },
    { id: 'c16-ox-15', text: `この段階の Access Token の <code>aud</code> が <code>account</code> なのは、まだ API 向けの設定をしていないためである。`, answer: true, explain: `API 向けの設定(Client Role や Audience Mapper)をしていないので、<b class="key">aud は account</b>。Step 11 以降で変わる。`, lesson: 'c16-l03' },
    { id: 'c16-ox-16', text: `Access Token の <code>azp</code> には、トークンを要求した <code>frontend-spa</code> ではなく、ユーザー taro の UUID が入っている。`, answer: false, explain: `<code>azp</code> は<b class="key">要求した client</b>(<code>frontend-spa</code>)。taro の UUID が入るのは <code>sub</code> である。`, lesson: 'c16-l03' },
    { id: 'c16-ox-17', text: `管理画面の Evaluate を使うと、ログインし直さなくても、設定変更後に発行されるトークンの内容を事前に確認できる。`, answer: true, explain: `Evaluate は<b class="key">ログインせずに</b>トークンの内容を確認できる。Mapper の実験で何度も使う。`, lesson: 'c16-l03' },
    { id: 'c16-ox-18', text: `Userinfo エンドポイントは、client secret で認証して呼び出す。`, answer: false, explain: `Userinfo には <b class="key">Access Token を Bearer で渡す</b>。呼び出し側の client 認証が必要なのは Introspection のほうである。`, lesson: 'c16-l03' },
    { id: 'c16-ox-19', text: `<code>backend-api</code> の Client authentication を ON にするのは、Introspection を呼ぶときに使う secret を取るためである。`, answer: true, explain: `<code>backend-api</code> はログインを担当しないが、<b class="key">Introspection で使う secret</b> を取るために ON にする。`, lesson: 'c16-l04' },
    { id: 'c16-ox-20', text: `Step 4 で取った Access Token は、5分(<code>expires_in</code>)経過後に Introspection しても <code>active: true</code> のままである。`, answer: false, explain: `有効期限が過ぎると <b class="key">{"active": false}</b> になる。Introspection は今そのトークンが有効かどうかを答える。`, lesson: 'c16-l04' },
    { id: 'c16-ox-21', text: `Step 9 で <code>-u 'backend-web:SECRET'</code> を外してトークン交換すると、<code>unauthorized_client</code> になる。`, answer: true, explain: `<code>backend-web</code> は Client authentication が ON なので、secret が無いと "Invalid client or Invalid client credentials" で拒否される。`, lesson: 'c16-l04' },
    { id: 'c16-ox-22', text: `<code>frontend-spa</code> が secret なしでトークン交換できたのは、<code>frontend-spa</code> が Confidential client だからである。`, answer: false, explain: `secret なしで通るのは <b class="key">Public client</b>(Client authentication OFF)だから。Confidential の <code>backend-web</code> は secret が必須である。`, lesson: 'c16-l04' },
    { id: 'c16-ox-23', text: `<code>batch-job</code> に <code>client_credentials</code> でトークンを要求すると、<code>access_token</code> に加えて <code>refresh_token</code> と <code>id_token</code> も返る。`, answer: false, explain: `返るのは <code>access_token</code> で、<b class="key">refresh_token と id_token は無い</b>。ユーザーが関与しないフローだからである。`, lesson: 'c16-l04' },
    { id: 'c16-ox-24', text: `Public client の <code>frontend-spa</code> で <code>grant_type=client_credentials</code> を試すと、<code>unauthorized_client</code> になる。`, answer: true, explain: `Client Credentials は <b class="key">Public では使えない</b>。ON + Service accounts の <code>batch-job</code> でのみ成功する。`, lesson: 'c16-l04' },
    { id: 'c16-ox-25', text: `taro に <code>backend-api</code> の <code>read</code> ロールを割り当てると、すでに取得済みの古いトークンにも <code>resource_access</code> が反映される。`, answer: false, explain: `<b class="key">古いトークンは変わらない</b>。ロール付与後に、トークンを取り直す必要がある(Evaluate なら取り直し不要)。`, lesson: 'c16-l05' },
    { id: 'c16-ox-26', text: `Step 11 で <code>aud</code> に <code>backend-api</code> が増えるのは、<code>roles</code> スコープの Audience Resolve が働いたためである。`, answer: true, explain: `<code>roles</code> スコープの <b class="key">Audience Resolve</b> が、付与されたクライアントロールの持ち主を aud に追加する。`, lesson: 'c16-l05' },
    { id: 'c16-ox-27', text: `User Attribute Mapper では、User Attribute に出したい claim 名 <code>dept</code> を、Token Claim Name に Users 画面の属性キー <code>department</code> を指定する。`, answer: false, explain: `逆である。<b class="key">User Attribute</b> は読み取り元の属性キー(<code>department</code>)、<b class="key">Token Claim Name</b> は出力する claim 名(<code>dept</code>)。`, lesson: 'c16-l05' },
    { id: 'c16-ox-28', text: `Users 画面に Attributes タブが無い場合は、Realm settings → User profile で「Unmanaged attributes」を有効にする。`, answer: true, explain: `Attributes タブが無いときは <b class="key">Unmanaged attributes</b> を有効にすると使える。`, lesson: 'c16-l05' },
    { id: 'c16-ox-29', text: `Audience Mapper で <code>backend-api</code> を固定追加しておけば、ロールを外しても <code>aud</code> に <code>backend-api</code> が残る。`, answer: true, explain: `Audience Mapper は<b class="key">ロールと無関係に固定で</b> aud を追加するため、ロールを外しても残る。`, lesson: 'c16-l05' },
    { id: 'c16-ox-30', text: `Revoke Refresh Token を ON にした状態で同じ <code>refresh_token</code> を2回使うと、2回目は <code>invalid_grant</code> になる。`, answer: true, explain: `Refresh Token が<b class="key">使い捨て(Rotation)</b>になるので、2回目は <code>invalid_grant</code> である。`, lesson: 'c16-l06' },
    { id: 'c16-ox-31', text: `Step 13 のリクエストで <code>refresh_token</code> を送るときは、<code>grant_type</code> に <code>authorization_code</code> を指定する。`, answer: false, explain: `更新では <b class="key">grant_type=refresh_token</b> を指定する。<code>authorization_code</code> は code を token に交換するときの値である。`, lesson: 'c16-l06' },
    { id: 'c16-ox-32', text: `logout 後に古い Refresh Token で更新しようとすると、<code>invalid_grant</code>(Session not active)になる。`, answer: true, explain: `logout で <b class="key">SSO セッションが終了</b>しているので、そのセッションの Refresh Token では更新できない。`, lesson: 'c16-l06' },
    { id: 'c16-ox-33', text: `logout の URL の <code>id_token_hint</code> には、Access Token を渡す。`, answer: false, explain: `渡すのは <b class="key">ID Token</b>(Step 4 で得た <code>id_token</code>)である。`, lesson: 'c16-l06' },
    { id: 'c16-ox-34', text: `Step 15 の API は、<code>read</code> ロールの無いトークンを受け取ると、401 ではなく 403 を返す。`, answer: true, explain: `署名や aud が正しくても <code>read</code> ロールが無ければ、<b class="key">403</b>(need role: read)を返す。401 は検証失敗のときである。`, lesson: 'c16-l06' },
    { id: 'c16-ox-35', text: `Step 11 より前に取ったトークンで API を呼ぶと、署名が合わず 401 になる。`, answer: false, explain: `署名が合わないのではなく、<b class="key">aud が合わず</b>に 401 になる。当時の aud は <code>account</code> で、<code>backend-api</code> を含まない。`, lesson: 'c16-l06' },
    { id: 'c16-ox-36', text: `ログイン失敗の理由(<code>invalid_redirect_uri</code> など)を管理画面で見るには、Realm settings → Events → Save events を ON にする。`, answer: true, explain: `<b class="key">Events</b> の Save events を ON にすると、ログイン失敗の理由が記録されて見える。`, lesson: 'c16-l06' }
  ],
  mc: [
    { id: 'c16-mc-01', stem: `【組合せ型】Step 4 の PKCE を使った手動実行に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `<code>code_verifier</code> を最初の認可 URL に付けて Keycloak に渡す。` },
        { label: 'B', text: `認可 URL には <code>code_challenge</code> を付け、トークン交換のときに <code>code_verifier</code> を送る。` },
        { label: 'C', text: `callback ページが接続エラーになっても、アドレスバーの URL に <code>code</code> があれば先に進める。` },
        { label: 'D', text: `交換に失敗したら、同じ code でもう一度 4-4 を実行すれば通る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× 最初に渡すのはハッシュである <b class="key">code_challenge</b> であり、code_verifier ではない。`,
        `B：○ challenge を先に渡し、verifier はトークン交換のときに送る。`,
        `C：○ <code>localhost:3000</code> では何も動いていないのでエラー表示が正常で、必要なのはアドレスバーの code と state である。`,
        `D：× code は<b class="key">使い捨て</b>。失敗したら 4-2 からやり直して新しい code を取る。`
      ],
      tip: `秘密(verifier)は手元、ハッシュ(challenge)だけ先に渡す。ブラウザの callback 画面ではなく URL の中身が主役。` },
    { id: 'c16-mc-02', stem: `【正誤選択型】この章で作った client の違いに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'frontend-spa は Credentials タブを持たないが、Client authentication は ON である。',
        'backend-web は secret を付けなくても、frontend-spa と同じ手順でトークン交換に成功する。',
        'backend-api は Standard flow を ON にして、ユーザーのログインを受け持つ。',
        'batch-job が Client Credentials Flow で得たトークンには、id_token も含まれる。',
        'Public client の frontend-spa が client_credentials を要求すると、unauthorized_client になる。'
      ], answer: 5,
      explain: [
        `1：× Credentials タブが無いのは Client authentication が <b class="key">OFF</b>(Public)だからである。`,
        `2：× backend-web は ON なので <b class="key">secret が必須</b>。外すと unauthorized_client になる。`,
        `3：× backend-api はフローをすべて OFF にし、Introspection 用の secret を取るために ON にしただけである。`,
        `4：× Client Credentials のトークンには <b class="key">id_token も refresh_token も無い</b>。`,
        `5：○ Client Credentials は Public では使えず、<code>unauthorized_client</code> になる。`
      ],
      tip: `Public は secret を持てない → Client Credentials のように client 自身を認証するフローは使えない。` },
    { id: 'c16-mc-03', stem: `【組合せ型】Step 5 と Step 11〜12 で観察した <code>aud</code> に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `ロール付与前の Access Token の <code>aud</code> が <code>account</code> なのは、API 向けの設定をまだしていないためである。` },
        { label: 'B', text: `ロール付与後に <code>aud</code> へ <code>backend-api</code> が増えるのは、<code>roles</code> スコープの Audience Resolve による。` },
        { label: 'C', text: `ロールを付与すると、取得済みの古い Access Token の <code>aud</code> も自動的に書き換わる。` },
        { label: 'D', text: `Audience Mapper で追加した <code>backend-api</code> は、ロールを外すと <code>aud</code> から消える。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：○ 何も設定していなければ aud は <code>account</code> のままである。`,
        `B：○ ロールを付けるとその持ち主の client が <b class="key">Audience Resolve</b> で aud に入る。`,
        `C：× <b class="key">古いトークンは変わらない</b>。取り直す(または Evaluate で見る)必要がある。`,
        `D：× Audience Mapper は<b class="key">固定で</b>追加するので、ロールを外しても残る。`
      ],
      tip: `aud を足す経路は2つ(ロール由来の Audience Resolve と、固定の Audience Mapper)。どちらもトークンは発行時点で決まる。` },
    { id: 'c16-mc-04', stem: `【正誤選択型】Evaluate と Mapper の実験に関する次の記述のうち、誤っているものはどれか。`,
      items: [],
      choices: [
        'Evaluate を使えば、ログインしなくても設定変更後に発行されるトークンの内容を確認できる。',
        'User Attribute Mapper では、User Attribute に Users 画面の属性キー department を指定する。',
        'Mapper の Add to access token を OFF にすると、Evaluate の Access Token から dept が消える。',
        'Users 画面に Attributes タブが無いときは、Realm settings の Events で Save events を ON にする。',
        'Audience Mapper は、Included Client Audience に指定した client を固定で aud に追加する。'
      ], answer: 4,
      explain: [
        `1：○ Evaluate は<b class="key">ログインせずに</b>トークン内容を確認できる。`,
        `2：○ User Attribute は<b class="key">読み取り元</b>の属性キーである。`,
        `3：○ OFF にするとその claim は Access Token に出ない。`,
        `4：× Attributes タブが無いときは Realm settings → User profile の <b class="key">Unmanaged attributes</b> を有効にする。Events はログイン失敗の理由を見る機能である。`,
        `5：○ Audience Mapper は固定で aud を足す。`
      ],
      tip: `設定画面の場所を症状で結びつける。タブが無い → User profile、失敗理由 → Events、中身確認 → Evaluate。` },
    { id: 'c16-mc-05', stem: `【組合せ型】Step 13〜14 の Refresh と Logout に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Revoke Refresh Token が ON のとき、同じ <code>refresh_token</code> の2回目の使用は <code>invalid_grant</code> になる。` },
        { label: 'B', text: `<code>post_logout_redirect_uri</code> を使うには、Valid redirect URIs に戻り先を登録すればよい。` },
        { label: 'C', text: `logout で SSO セッションが終わるため、古い Refresh Token での更新は <code>invalid_grant</code>(Session not active)になる。` },
        { label: 'D', text: `logout 後にもう一度認可 URL を開いても、SSO セッションが残るのでログイン画面は出ない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ Revoke Refresh Token(Rotation)で Refresh Token は使い捨てになる。`,
        `B：× 登録先は <b class="key">Valid post logout redirect URIs</b> という別の欄である。`,
        `C：○ セッションが終了しているので、紐づく Refresh Token は使えない。`,
        `D：× logout で <b class="key">SSO セッションが終わる</b>ため、ログイン画面が再び出る。`
      ],
      tip: `Refresh Token はセッションに紐づく。セッションが死ねば更新できず、Rotation が ON なら使い捨てにもなる。` },
    { id: 'c16-mc-06', stem: `【正誤選択型】Step 15 の API によるトークン検証に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'aud が合わずに検証に失敗する場合、API は 403 を返す。',
        '署名の検証に使う公開鍵は、PyJWKClient が Keycloak の certs(JWKS)から取得する。',
        'トークンの末尾1文字を変えても署名は有効なので、API は成功を返す。',
        'read ロールの無いトークンは、署名エラーとして 401 になる。',
        '5分以上経ったトークンは、exp の検証は通るが aud の検証で 401 になる。'
      ], answer: 2,
      explain: [
        `1：× aud 不一致は検証失敗なので <b class="key">401</b> である。403 はロール不足のとき。`,
        `2：○ <code>PyJWKClient</code> が <code>/protocol/openid-connect/certs</code> から鍵を取り、署名を検証する。`,
        `3：× 1文字変えると<b class="key">署名エラー</b>になり 401 である。`,
        `4：× 署名は正しいので検証は通り、ロール不足として <b class="key">403</b> になる。`,
        `5：× 5分以上経つと <code>Signature has expired</code>、つまり exp の検証で 401 になる。`
      ],
      tip: `401 = トークン自体が検証に通らない、403 = トークンは正しいが権限(ロール)が足りない。` },
    { id: 'c16-mc-07', stem: `【組合せ型】Step 4 で出たエラーと対処に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `"Code not valid" が出たら、同じ code を使って 4-4 だけやり直す。` },
        { label: 'B', text: `"PKCE verification failed" は、verifier が challenge と合わなくなったことが原因で、4-1 からやり直す。` },
        { label: 'C', text: `<code>Invalid parameter: redirect_uri</code> は、client_id のスペルミスが原因である。` },
        { label: 'D', text: `<code>Invalid client</code> は、client_id のスペルミスが原因になる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× code は使い捨てなので、<b class="key">4-2 からやり直す</b>必要がある。`,
        `B：○ 別ターミナルで verifier を作り直した等で、challenge と合わなくなるのが原因である。`,
        `C：× redirect_uri のエラーは <b class="key">Step 3 の Valid redirect URIs との不一致</b>が原因である。`,
        `D：○ client_id が違うと client が見つからず Invalid client になる。`
      ],
      tip: `エラー文の主語を見る。redirect_uri は URL の登録、client は client_id、PKCE は verifier と challenge の対応。` },
    { id: 'c16-mc-08', stem: `【正誤選択型】Step 0〜3 の準備に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Temporary を ON のままパスワードを設定すると、初回ログインでパスワード変更が求められて手順が止まる。',
        'docker run の --rm は、コンテナを止めても設定が残るようにするオプションである。',
        'localhost:3000 でアプリを起動しておかないと、ログイン後の callback で code を取り出せない。',
        'Discovery の issuer は、後でトークンの aud に入る値である。',
        'Step 3 では Standard flow を含め、Authentication flow はすべて OFF にする。'
      ], answer: 1,
      explain: [
        `1：○ Temporary ON は初回ログインで<b class="key">パスワード変更を要求</b>するので流れが止まる。`,
        `2：× <code>--rm</code> を付けると止めたときに<b class="key">設定ごと消える</b>。`,
        `3：× アドレスバーの URL から code を取れるので、アプリの起動は不要である。`,
        `4：× issuer が入るのは <b class="key">iss</b> である。`,
        `5：× Standard flow だけを ON にして、他を OFF にする。`
      ],
      tip: `準備の落とし穴は「流れが止まる原因」として覚える。Temporary、--rm、issuer は iss。` },
    { id: 'c16-mc-09', stem: `【組合せ型】Step 8〜10 の実験結果に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `<code>backend-api</code> の Client authentication を OFF にしても、同じ手順で Introspection を呼べる。` },
        { label: 'B', text: `<code>batch-job</code> のトークンの <code>sub</code> は taro の UUID である。` },
        { label: 'C', text: `<code>batch-job</code> のトークンの <code>preferred_username</code> は <code>service-account-batch-job</code> である。` },
        { label: 'D', text: `Introspection は呼び出し側の認証が必要で、実験では <code>backend-api</code> の secret を使った。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× secret を取るために <b class="key">ON にした</b>のであり、Public ではこの呼び出しはできない。`,
        `B：× sub は Users 画面の <b class="key">service-account-batch-job</b> ユーザーの ID である。`,
        `C：○ サービスアカウント用のユーザー名になる。`,
        `D：○ <code>-u 'backend-api:API_SECRET'</code> で呼び出し側を認証した。`
      ],
      tip: `Client Credentials では「人」の代わりに自動作成のサービスアカウントユーザーが主体になる。` },
    { id: 'c16-mc-10', stem: `【正誤選択型】Introspection・Userinfo・トークンの中身に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Step 8 で取った Access Token は、有効期限が過ぎても Introspection で active: true が返り続ける。',
        'Userinfo を呼ぶときは、-u で client secret を送って認証する。',
        'Introspection を backend-api の secret で呼ぶと、有効な Access Token には active: true が返る。',
        'Access Token の azp には、ユーザー taro の UUID が入る。',
        'ID Token の aud は account で、Access Token の aud は frontend-spa である。'
      ], answer: 3,
      explain: [
        `1：× 期限切れなら <b class="key">active: false</b> になる。`,
        `2：× Userinfo は Access Token を <b class="key">Bearer</b> で渡して呼ぶ。`,
        `3：○ 呼び出し側を認証した Introspection は、有効なトークンに <code>active: true</code> を返す。`,
        `4：× azp は要求した client(<code>frontend-spa</code>)で、taro の UUID は <b class="key">sub</b> である。`,
        `5：× 逆で、Access Token の aud が <code>account</code>、ID Token の aud が <code>frontend-spa</code> である。`
      ],
      tip: `誰が(azp)・誰のために(aud)・誰の話か(sub)を分けて読む。Introspection は呼び出し側の認証つき。` }
  ]
});

DATA.chapters.push({
  no: 17, title: `トラブルシューティング・用語集・学習リソース`,
  lessons: [
    { id: 'c17-l01', title: `エラー早見表`, pages: [
      { id: 'c17-l01-p01', title: `エラー早見表(1) redirect_uri・client・grant`,
        html: `<p>ログインやトークン取得で出るエラーは、メッセージから原因をたどれる。まず頻出の5つを整理する。</p><table><tr><th>エラー</th><th>原因</th></tr><tr><td><code>Invalid parameter: redirect_uri</code></td><td>Valid redirect URIs 不一致(末尾スラッシュ・ポート・http/https)</td></tr><tr><td><code>invalid_client</code> / <code>unauthorized_client</code></td><td>Client authentication ON なのに secret 不備、または無効なフロー(例: OFF で client_credentials)</td></tr><tr><td><code>invalid_grant</code> + "Code not valid"</td><td>code の使い回し・期限切れ(約1分)・redirect_uri 不一致</td></tr><tr><td><code>invalid_grant</code> + "PKCE verification failed"</td><td>code_verifier が challenge と合わない</td></tr><tr><td><code>invalid_grant</code> + "Session not active"</td><td>SSO セッション期限切れ → 再ログイン</td></tr></table><span class="trap"><code>invalid_grant</code> は同じ名前でも3種類ある。原因は一緒に出る文言(Code not valid / PKCE verification failed / Session not active)で見分ける。</span>`,
        oxIds: ['c17-ox-01', 'c17-ox-02', 'c17-ox-03'] },
      { id: 'c17-l01-p02', title: `エラー早見表(2) scope・アカウント・パス・CORS・HTTPS`,
        html: `<p>続いて、設定ミスや環境の違いで出やすいエラーを整理する。</p><table><tr><th>エラー</th><th>原因</th></tr><tr><td><code>invalid_scope</code></td><td>存在しない、または割り当てていない Client Scope を要求した</td></tr><tr><td><code>Account is not fully set up</code></td><td>Required action が残っている、または email / firstName / lastName が必須設定になっている</td></tr><tr><td><code>Resource not found</code> (404)</td><td>realm 名のミス、旧 <code>/auth</code> パス</td></tr><tr><td>CORS エラー</td><td><b class="key">Web origins</b> が未設定</td></tr><tr><td><code>HTTPS required</code></td><td>外部アクセスで SSL Required = <code>external</code></td></tr></table><h4>HTTPS required への対処</h4><p>SSL Required を <code>none</code> にすれば通るが、<span class="trap"><code>none</code> は開発のみ</span>で使う設定である。本番では HTTPS で動かすのが前提になる。</p>`,
        oxIds: ['c17-ox-04', 'c17-ox-05'] }
    ] },
    { id: 'c17-l02', title: `API側で401・claim が出ない`, pages: [
      { id: 'c17-l02-p01', title: `API 側で 401 になる原因`,
        html: `<p>API がトークンを受け取って 401 を返すとき、確認すべき原因は4つある。第16章の Step 15 でも aud 不一致と exp 切れを再現した。</p><h4>確認する4つ</h4><ul><li><b class="key">iss 不一致</b>: Docker 内では <code>keycloak:8080</code>、ブラウザからは <code>localhost:8080</code> のように、アクセス元でホスト名が違うことで起きる。対処は <code>KC_HOSTNAME</code> / Frontend URL を統一すること</li><li><b class="key">aud に自分がいない</b>: Audience Mapper を追加する、または Client Role を付与する</li><li><b class="key">exp 切れ / サーバー時刻ずれ</b></li><li><b class="key">署名検証失敗</b>: 鍵ローテーション後に、API 側の JWKS キャッシュが古いままになっている</li></ul><p>トークンは iss・aud・exp・署名の順に検証されるイメージで、どの項目で落ちたかを切り分けると原因に近づける。</p>`,
        oxIds: ['c17-ox-06', 'c17-ox-07'] },
      { id: 'c17-l02-p02', title: `claim が出ないときの確認項目`,
        html: `<p>期待した claim がトークンに無いときは、次の6項目を上から確認する。</p><ol><li>Mapper の「<b class="key">Add to access token</b>」が OFF になっていないか</li><li><b class="key">Client Scope が Client に未割り当て</b>(Default / Optional のどちらにも入っていない)ではないか</li><li><b class="key">Optional なのに <code>scope=</code> に書いていない</b>のではないか</li><li><b class="key">Full Scope Allowed が OFF</b> で、ロールが絞られていないか</li><li>User Attribute 名のスペルミス、または値が未設定ではないか</li><li><b class="key">Lightweight Access Token</b> が有効で、claim が省略されていないか</li></ol><span class="trap">Default の Client Scope は常に適用されるが、Optional は要求(<code>scope=</code>)に名前を書いたときだけ適用される。割り当てただけでは出ない。</span><p>確認には、第16章の Step 6 で使った Evaluate が役立つ。</p>`,
        oxIds: ['c17-ox-08', 'c17-ox-09'] }
    ] },
    { id: 'c17-l03', title: `用語集`, pages: [
      { id: 'c17-l03-p01', title: `用語集(1) 認証・認可の基本`,
        html: `<table><tr><th>用語</th><th>意味</th></tr><tr><td><b class="key">認証 (Authentication)</b></td><td>「あなたは誰?」を確認すること(ログイン)</td></tr><tr><td><b class="key">認可 (Authorization)</b></td><td>「あなたは何をしてよい?」を判断すること</td></tr><tr><td><b class="key">IdP (Identity Provider)</b></td><td>認証を担当する側。Keycloak がこれ</td></tr><tr><td><b class="key">SP / RP</b> (Service Provider / Relying Party)</td><td>ログインを IdP に任せる側。つまりアプリ</td></tr><tr><td><b class="key">SSO (Single Sign-On)</b></td><td>一度ログインすれば複数アプリで再ログイン不要になる仕組み</td></tr><tr><td><b class="key">MFA (多要素認証)</b></td><td>パスワード + スマホのコードなど、複数の要素で確認すること</td></tr></table><span class="trap">認証(誰か)と認可(何をしてよいか)は混同しやすい。ログインは認証、アクセス許可の判断は認可である。</span>`,
        oxIds: ['c17-ox-10', 'c17-ox-11'] },
      { id: 'c17-l03-p02', title: `用語集(2) OAuth / OIDC`,
        html: `<table><tr><th>用語</th><th>意味</th></tr><tr><td><b class="key">OAuth 2.0</b></td><td>認可の標準。アプリに、ユーザーの代わりに API を使う権限を渡す仕組み</td></tr><tr><td><b class="key">OIDC</b> (OpenID Connect)</td><td>OAuth 2.0 に「ユーザーが誰か」を伝える仕組み(ID Token)を足したもの</td></tr><tr><td>Grant Type</td><td>トークンの取り方の種類(authorization_code, client_credentials, refresh_token ...)</td></tr><tr><td>Scope</td><td>どの範囲の情報・操作を許可してほしいかの要求(スペース区切りの文字列)</td></tr><tr><td>Claim</td><td>トークンに入っている1つの情報(名前と値)</td></tr><tr><td>Redirect URI</td><td>ログイン後にブラウザを戻す先の URL</td></tr><tr><td><b class="key">State</b></td><td>CSRF 対策。送った値が戻ってきたかを照合する</td></tr><tr><td><b class="key">Nonce</b></td><td>ID Token の使い回し(リプレイ)防止用のランダム値</td></tr><tr><td><b class="key">PKCE</b> (ピクシー)</td><td>Authorization Code の横取り対策。<code>code_verifier</code> と <code>code_challenge</code> を使う</td></tr><tr><td>Bearer Token</td><td>持っている人が使えるトークン。盗まれると悪用される</td></tr><tr><td>Confidential / Public Client</td><td>secret を安全に持てる / 持てないクライアント</td></tr><tr><td>BFF</td><td>SPA の代わりにサーバー側がトークンを扱う構成</td></tr></table>`,
        oxIds: ['c17-ox-12', 'c17-ox-13'] },
      { id: 'c17-l03-p03', title: `用語集(3) トークン関連`,
        html: `<table><tr><th>用語</th><th>意味</th></tr><tr><td><b class="key">JWT</b> (JSON Web Token)</td><td><code>header.payload.signature</code> 形式の署名付きトークン</td></tr><tr><td><b class="key">JWS / JWE</b></td><td>JWT の署名版 / 暗号化版</td></tr><tr><td><b class="key">JWKS</b> (JSON Web Key Set)</td><td>署名検証用の公開鍵一覧(JSON)</td></tr><tr><td><b class="key">kid</b> (Key ID)</td><td>どの鍵で署名したかを示す ID</td></tr><tr><td>Introspection</td><td>トークンが有効かをサーバーに問い合わせること</td></tr><tr><td>Revocation</td><td>トークンを失効させること</td></tr><tr><td><b class="key">Offline Token</b></td><td>ユーザー不在でも長期間使える Refresh Token</td></tr><tr><td><b class="key">Sender-constrained Token</b></td><td>DPoP や mTLS で「持ち主」に紐づけ、盗用されても使えなくしたトークン</td></tr><tr><td>ACR</td><td>認証の強さのレベル(Authentication Context Class Reference)</td></tr><tr><td>AMR</td><td>使われた認証方法(<code>pwd</code>, <code>otp</code> など。Authentication Methods References)</td></tr></table><span class="trap">Offline Token は「長く使える」、Sender-constrained Token は「持ち主に縛る」。どちらも盗難対策や長期利用に関わるが、目的が違う。</span>`,
        oxIds: ['c17-ox-14', 'c17-ox-15'] },
      { id: 'c17-l03-p04', title: `用語集(4) Keycloak 固有と規格`,
        html: `<h4>Keycloak 固有</h4><table><tr><th>用語</th><th>意味</th></tr><tr><td><b class="key">Realm</b></td><td>ユーザーや設定を隔離する管理単位</td></tr><tr><td>Client</td><td>Keycloak に登録するアプリ / API</td></tr><tr><td>Client Scope</td><td>トークンに載せる情報のセット</td></tr><tr><td>Protocol Mapper</td><td>claim を作る部品</td></tr><tr><td>Realm Role / Client Role / Composite Role</td><td>realm 共通 / クライアント専用 / 束ねたロール</td></tr><tr><td><b class="key">Service Account</b></td><td>Client Credentials 用の自動作成ユーザー</td></tr><tr><td><b class="key">Required Action</b></td><td>次回ログイン時に必ずやらせる作業</td></tr><tr><td>Authentication Flow</td><td>ログイン手順の定義</td></tr><tr><td><b class="key">Identity Brokering</b></td><td>外部 IdP にログインを任せて、結果を Keycloak 経由で受け取る</td></tr><tr><td><b class="key">User Federation</b></td><td>LDAP / AD など既存の名簿を Keycloak につなぐ</td></tr><tr><td>SPI</td><td>Java で Keycloak を拡張する仕組み</td></tr><tr><td>Infinispan</td><td>Keycloak 内蔵の分散キャッシュ</td></tr></table><h4>規格</h4><ul><li><b class="key">OAuth 2.1</b>: Implicit と Password Grant を廃止し PKCE を必須化した OAuth 2.0 の整理版(策定中)</li><li><b class="key">SAML 2.0</b>: XML ベースの SSO 規格。企業システムで現役</li><li><b class="key">LDAP</b>: ディレクトリ(ユーザー名簿)へのアクセス規格</li></ul>`,
        oxIds: ['c17-ox-16', 'c17-ox-17'] }
    ] },
    { id: 'c17-l04', title: `学習リソース`, pages: [
      { id: 'c17-l04-p01', title: `学習リソース`,
        html: `<h4>公式ドキュメント</h4><ul><li><code>https://www.keycloak.org/documentation</code></li><li>Server Admin Guide / Securing Apps</li></ul><h4>RFC・仕様</h4><table><tr><th>文書</th><th>内容</th></tr><tr><td>RFC 6749</td><td>OAuth 2.0</td></tr><tr><td>RFC 7636</td><td>PKCE</td></tr><tr><td>RFC 7519</td><td>JWT</td></tr><tr><td>RFC 8693</td><td>Token Exchange</td></tr><tr><td>RFC 8628</td><td>Device Grant</td></tr><tr><td>RFC 7662</td><td>Introspection</td></tr><tr><td>OpenID Connect Core 1.0</td><td>OIDC の中心仕様</td></tr></table><h4>見るべき JSON とツール</h4><ul><li>見るべき JSON: <code>/.well-known/openid-configuration</code></li><li>ツール: jwt.io、Postman、<code>curl</code> + <code>jq</code>、oidcdebugger.com</li></ul>`,
        oxIds: ['c17-ox-18'] }
    ] }
  ],
  ox: [
    { id: 'c17-ox-01', text: `<code>invalid_grant</code> は、一緒に出る文言(Code not valid / PKCE verification failed / Session not active)によって原因が変わる。`, answer: true, explain: `<code>invalid_grant</code> は3種類あり、<b class="key">一緒に出る文言</b>で原因を見分ける。`, lesson: 'c17-l01' },
    { id: 'c17-ox-02', text: `<code>invalid_grant</code> + "Session not active" は、code_verifier が challenge と合わないときに出る。`, answer: false, explain: `それは "PKCE verification failed" の原因。"Session not active" は <b class="key">SSO セッションの期限切れ</b>で、再ログインで解消する。`, lesson: 'c17-l01' },
    { id: 'c17-ox-03', text: `<code>Invalid parameter: redirect_uri</code> は Valid redirect URIs との不一致で出るので、末尾スラッシュやポート、http / https の違いにも注意が必要である。`, answer: true, explain: `登録した <b class="key">Valid redirect URIs</b> と一致しないと出る。末尾スラッシュ・ポート・http/https の違いも不一致になる。`, lesson: 'c17-l01' },
    { id: 'c17-ox-04', text: `CORS エラーが出たときは、まず Client の Web origins が未設定でないかを確認する。`, answer: true, explain: `CORS エラーの原因として挙がるのは <b class="key">Web origins の未設定</b>である。`, lesson: 'c17-l01' },
    { id: 'c17-ox-05', text: `<code>HTTPS required</code> は、外部アクセスで SSL Required が <code>none</code> のままになっているときに出る。`, answer: false, explain: `出るのは SSL Required が <b class="key">external</b> のとき。<code>none</code> にすると通るが、開発のみで使う設定である。`, lesson: 'c17-l01' },
    { id: 'c17-ox-06', text: `ブラウザは <code>localhost:8080</code>、API は Docker 内の <code>keycloak:8080</code> で Keycloak にアクセスしていると、iss が一致せず検証に失敗することがある。`, answer: true, explain: `アクセス元でホスト名が違うと <b class="key">iss 不一致</b>になる。<code>KC_HOSTNAME</code> / Frontend URL を統一して対処する。`, lesson: 'c17-l02' },
    { id: 'c17-ox-07', text: `<code>aud</code> に API 自身が含まれていないときの対処は、<code>KC_HOSTNAME</code> を統一することである。`, answer: false, explain: `それは iss 不一致への対処。aud に自分がいないときは <b class="key">Audience Mapper の追加</b>か <b class="key">Client Role の付与</b>で対処する。`, lesson: 'c17-l02' },
    { id: 'c17-ox-08', text: `Optional な Client Scope は、Client に割り当ててあれば、<code>scope=</code> に名前を書かなくても claim が出る。`, answer: false, explain: `Optional は <b class="key">scope= に書いたときだけ</b>適用される。割り当てただけでは出ない(Default は常に適用)。`, lesson: 'c17-l02' },
    { id: 'c17-ox-09', text: `Mapper の「Add to access token」が OFF だと、Access Token に claim が出ない。`, answer: true, explain: `OFF の Mapper の claim は Access Token に出ない。claim が出ないときの<b class="key">最初の確認項目</b>である。`, lesson: 'c17-l02' },
    { id: 'c17-ox-10', text: `認可(Authorization)は、「あなたは誰か」を確認することである。`, answer: false, explain: `それは<b class="key">認証</b>。認可は「あなたは何をしてよいか」を判断することである。`, lesson: 'c17-l03' },
    { id: 'c17-ox-11', text: `Keycloak は IdP であり、ログインを Keycloak に任せるアプリは SP / RP と呼ばれる。`, answer: true, explain: `認証を担当するのが <b class="key">IdP</b>(Keycloak)、ログインを任せる側が <b class="key">SP / RP</b>(アプリ)である。`, lesson: 'c17-l03' },
    { id: 'c17-ox-12', text: `State は ID Token の使い回し(リプレイ)を防ぐための値で、Nonce は CSRF 対策の値である。`, answer: false, explain: `取り違えている。<b class="key">State</b> が CSRF 対策、<b class="key">Nonce</b> が ID Token のリプレイ防止である。`, lesson: 'c17-l03' },
    { id: 'c17-ox-13', text: `OAuth 2.0 は「ユーザーが誰か」を伝えるための規格で、OIDC はその上に認可を足したものである。`, answer: false, explain: `逆である。<b class="key">OAuth 2.0</b> は認可の標準で、<b class="key">OIDC</b> がそこに「ユーザーが誰か」を伝える ID Token を足したものである。`, lesson: 'c17-l03' },
    { id: 'c17-ox-14', text: `JWKS は署名検証用の公開鍵の一覧で、kid はそのうちどの鍵で署名されたかを示す ID である。`, answer: true, explain: `<b class="key">JWKS</b> が公開鍵一覧、<b class="key">kid</b> がどの鍵で署名したかを示す ID である。`, lesson: 'c17-l03' },
    { id: 'c17-ox-15', text: `Sender-constrained Token は、ユーザー不在でも長期間使える Refresh Token のことである。`, answer: false, explain: `それは <b class="key">Offline Token</b>。Sender-constrained Token は DPoP や mTLS で持ち主に紐づけ、盗用されても使えなくしたトークンである。`, lesson: 'c17-l03' },
    { id: 'c17-ox-16', text: `Service Account とは、ユーザーが次回ログイン時に必ずやらされる作業のことである。`, answer: false, explain: `それは <b class="key">Required Action</b>。Service Account は Client Credentials 用の自動作成ユーザーである。`, lesson: 'c17-l03' },
    { id: 'c17-ox-17', text: `Identity Brokering は外部 IdP にログインを任せる仕組みで、User Federation は LDAP / AD など既存の名簿を Keycloak につなぐ仕組みである。`, answer: true, explain: `<b class="key">Identity Brokering</b> は外部 IdP へのログイン委任、<b class="key">User Federation</b> は既存の名簿との連携である。`, lesson: 'c17-l03' },
    { id: 'c17-ox-18', text: `学習リソースの RFC のうち、JWT は RFC 7519、Introspection は RFC 7662 である。`, answer: true, explain: `<b class="key">RFC 7519</b> が JWT、<b class="key">RFC 7662</b> が Introspection である。`, lesson: 'c17-l04' }
  ],
  mc: [
    { id: 'c17-mc-01', stem: `【組合せ型】エラーメッセージと原因に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `<code>invalid_grant</code> + "Code not valid" は、SSO セッションの期限切れで出る。` },
        { label: 'B', text: `<code>invalid_grant</code> + "PKCE verification failed" は、code_verifier が challenge と合わないときに出る。` },
        { label: 'C', text: `<code>Invalid parameter: redirect_uri</code> は、Client authentication が ON なのに secret が足りないときに出る。` },
        { label: 'D', text: `<code>invalid_grant</code> + "Session not active" は、SSO セッションが期限切れのときに出るので、再ログインで解消する。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× "Code not valid" は <b class="key">code の使い回し・期限切れ(約1分)・redirect_uri 不一致</b>で出る。`,
        `B：○ verifier が challenge と対応しないとき。`,
        `C：× redirect_uri のエラーは <b class="key">Valid redirect URIs の不一致</b>が原因。secret の不足は invalid_client 系。`,
        `D：○ SSO セッションが切れているので、再ログインする。`
      ],
      tip: `同じ invalid_grant でも、code・PKCE・セッションのどれが壊れたかを文言で切り分ける。` },
    { id: 'c17-mc-02', stem: `【正誤選択型】エラーと原因に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'invalid_scope は、Client Scope の名前が正しければ、Client への割り当てが無くても出ない。',
        'Account is not fully set up は、Required action が残っているか、email・firstName・lastName が必須設定のときに出ることがある。',
        'Resource not found (404) の原因は、Web origins の未設定である。',
        'CORS エラーの原因は、realm 名のミスや旧 /auth パスである。',
        'HTTPS required は、SSL Required を none から external に変えると解消する。'
      ], answer: 2,
      explain: [
        `1：× 存在しない、または<b class="key">割り当てていない</b> Client Scope を要求すると出る。`,
        `2：○ Required action の残存、または必須項目の未入力が原因になる。`,
        `3：× 404 の原因は realm 名のミスや旧 <code>/auth</code> パスで、Web origins は CORS エラーの原因である。`,
        `4：× それは Resource not found の原因。CORS は <b class="key">Web origins 未設定</b>が原因である。`,
        `5：× 逆である。<code>none</code> にすると通る(開発のみ)。external だと外部アクセスで HTTPS が必要になる。`
      ],
      tip: `エラー名と原因の組を1対1で結ぶ。404 は URL の間違い、CORS は Web origins、HTTPS は SSL Required。` },
    { id: 'c17-mc-03', stem: `【組合せ型】API 側で 401 になる原因と対処に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `iss の不一致は、Access Token の有効期限を延ばせば解消する。` },
        { label: 'B', text: `aud に自分がいないときは、API 側の署名検証鍵を取り直す。` },
        { label: 'C', text: `鍵ローテーション後に署名検証が失敗するときは、JWKS キャッシュが古い可能性がある。` },
        { label: 'D', text: `Docker 内の keycloak:8080 とブラウザの localhost:8080 のずれで iss が合わないときは、KC_HOSTNAME / Frontend URL を統一する。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× iss 不一致の原因はホスト名のずれで、有効期限とは無関係である。`,
        `B：× aud の問題には <b class="key">Audience Mapper / Client Role 付与</b>で対処する。署名鍵は関係しない。`,
        `C：○ 鍵が替わったのに API のキャッシュが古いと署名検証に失敗する。`,
        `D：○ ホスト名を <b class="key">KC_HOSTNAME / Frontend URL</b> で統一する。`
      ],
      tip: `401 の原因は iss・aud・exp・署名の4つ。症状ごとに直す場所が違う。` },
    { id: 'c17-mc-04', stem: `【正誤選択型】API 側で 401 になる原因に関する次の記述のうち、誤っているものはどれか。`,
      items: [],
      choices: [
        'exp 切れによる 401 は、署名検証鍵が古いことが原因なので、JWKS の取り直しで解消する。',
        'aud に API が含まれていないときは、Audience Mapper の追加や Client Role の付与で対処できる。',
        'iss の不一致は、Docker 内とブラウザで使うホスト名が違うことから起こりうる。',
        '署名検証の失敗は、鍵ローテーション後に API が JWKS を古いまま保持していることが原因になりうる。',
        'サーバー時刻のずれも、exp の検証に影響して 401 の原因になりうる。'
      ], answer: 1,
      explain: [
        `1：× exp 切れの原因は<b class="key">有効期限の経過やサーバー時刻のずれ</b>である。JWKS の古さは署名検証失敗の原因。`,
        `2：○ aud に自分がいないときの対処である。`,
        `3：○ <code>keycloak:8080</code> と <code>localhost:8080</code> のずれの例。`,
        `4：○ JWKS キャッシュが古いと、新しい鍵で署名したトークンを検証できない。`,
        `5：○ 時刻がずれると exp の判定が狂う。`
      ],
      tip: `期限(exp)と鍵(署名)は別の検証項目。原因と対処を取り違えない。` },
    { id: 'c17-mc-05', stem: `【組合せ型】claim が出ない原因に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Optional な Client Scope は、Client に割り当てるだけで常にトークンに反映される。` },
        { label: 'B', text: `Optional な Client Scope は、<code>scope=</code> にその名前を書かないと適用されない。` },
        { label: 'C', text: `Mapper の「Add to access token」が OFF だと、Access Token に claim が出ない。` },
        { label: 'D', text: `Full Scope Allowed が OFF だと、ロールは絞られず全ロールが入る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× Optional は割り当てただけでは適用されない。<b class="key">要求した scope に書く</b>必要がある。`,
        `B：○ Optional は scope= に書いたときだけ適用される。`,
        `C：○ OFF の Mapper の claim は Access Token に出ない。`,
        `D：× OFF だと<b class="key">ロールが絞られる</b>ので、期待したロールが出なくなる。`
      ],
      tip: `Default は自動、Optional は要求時だけ。割り当て ≠ 適用。` },
    { id: 'c17-mc-06', stem: `【正誤選択型】claim が出ないときの確認項目に関する次の記述のうち、誤っているものはどれか。`,
      items: [],
      choices: [
        'User Attribute 名のスペルミスや値の未設定でも、claim が出ないことがある。',
        'Lightweight Access Token が有効だと、claim が省略されて出ないことがある。',
        'Full Scope Allowed が OFF だと、ロールが絞られて期待したロールが出ないことがある。',
        'Client Scope が Client に未割り当てでも、Default か Optional かに関わらず claim は出る。',
        'Optional な Client Scope は、scope= に書かないと、その claim は出ない。'
      ], answer: 4,
      explain: [
        `1：○ 属性名や値の問題で claim が出ない。`,
        `2：○ <b class="key">Lightweight Access Token</b> では claim が省略される。`,
        `3：○ ロールが絞られる設定である。`,
        `4：× 未割り当ての Client Scope の Mapper は適用されず、claim は<b class="key">出ない</b>。`,
        `5：○ Optional は要求したときだけ適用される。`
      ],
      tip: `claim が出ない原因は「Mapper」「Scope の割り当て・要求」「ロールの絞り込み」「元データ」の4系統で整理する。` },
    { id: 'c17-mc-07', stem: `【組合せ型】用語の区別に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `State は CSRF 対策で、Nonce は ID Token の使い回し(リプレイ)防止に使う。` },
        { label: 'B', text: `Confidential client は、secret を安全に持てないクライアントである。` },
        { label: 'C', text: `Introspection はトークンが有効かを問い合わせることで、Revocation はトークンを失効させることである。` },
        { label: 'D', text: `JWS は JWT の暗号化版で、JWE は署名版である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ State は戻りの照合による CSRF 対策、Nonce は ID Token のリプレイ防止。`,
        `B：× secret を安全に持てるのが <b class="key">Confidential</b>、持てないのが Public である。`,
        `C：○ Introspection は問い合わせ、Revocation は失効である。`,
        `D：× 逆で、<b class="key">JWS が署名版、JWE が暗号化版</b>である。`
      ],
      tip: `対になる用語は「どちらがどちらか」を役割の言葉で言い換えて覚える(守る相手: State=CSRF、Nonce=リプレイ)。` },
    { id: 'c17-mc-08', stem: `【正誤選択型】用語に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        '認可は「あなたは誰か」を確認することで、認証は「何をしてよいか」を判断することである。',
        'Offline Token は DPoP や mTLS で持ち主に紐づけられたトークンである。',
        'Service Account は、次回ログイン時に必ずやらせる作業を指す。',
        'User Federation は外部 IdP にログインを任せる仕組みである。',
        'Identity Brokering は外部 IdP にログインを任せ、その結果を Keycloak 経由で受け取る仕組みである。'
      ], answer: 5,
      explain: [
        `1：× 逆で、認証が「誰か」、認可が「何をしてよいか」である。`,
        `2：× それは <b class="key">Sender-constrained Token</b>。Offline Token はユーザー不在でも長期間使える Refresh Token である。`,
        `3：× それは <b class="key">Required Action</b>。Service Account は Client Credentials 用の自動作成ユーザーである。`,
        `4：× それは Identity Brokering。User Federation は LDAP / AD など既存の名簿を Keycloak につなぐ仕組みである。`,
        `5：○ 外部 IdP にログインを任せ、結果を Keycloak 経由で受け取る。`
      ],
      tip: `外部に任せるのは「ログイン」なら Brokering、「名簿」なら Federation。` }
  ]
});
