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
