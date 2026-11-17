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
