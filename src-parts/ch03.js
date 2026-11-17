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
