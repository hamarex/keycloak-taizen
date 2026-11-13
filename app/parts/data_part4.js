// Keycloak 大全集 data part 4: 章 10〜15
DATA.chapters.push({
  no: 10, title: `API 側でのトークン検証`,
  lessons: [
    { id: 'c10-l01', title: `JWT のローカル検証`, pages: [
      { id: 'c10-l01-p01', title: `ローカル検証の考え方と署名の確認`,
        html: `<p>API がアクセストークン(JWT)を受け取ったとき、高速で推奨される方式は、Keycloak に聞かず <b class="key">API 自身が JWT をその場で検証する</b>ことである。これを JWT の<b class="key">ローカル検証</b>と呼ぶ。</p><h4>手順1: JWKS を取得してキャッシュする</h4><p>署名を確かめるには Keycloak の<b class="key">公開鍵</b>が要る。公開鍵は <b class="key">JWKS</b> エンドポイントで配られる。API は最初に取得して<b class="key">キャッシュ</b>しておく。</p><pre>GET /realms/myrealm/protocol/openid-connect/certs

{"keys":[{"kid":"abc123","kty":"RSA","alg":"RS256","use":"sig","n":"...","e":"AQAB"}]}</pre><h4>手順2: kid に合う公開鍵で署名を検証する</h4><p>JWT の header には鍵の目印である <code>kid</code> が入っている。JWKS の中から同じ <code>kid</code> の公開鍵を選び、<b class="key">署名検証</b>する。一度キャッシュしてしまえば、以降のリクエストのたびに Keycloak へ問い合わせる必要はない。</p><span class="trap">署名の検証に使うのは client secret ではなく、JWKS で配られる公開鍵である。</span>`,
        oxIds: ['c10-ox-01', 'c10-ox-02'] },
      { id: 'c10-l01-p02', title: `claim の検証チェックリスト`,
        html: `<p>署名が正しいだけでは足りない。中身(claim)が「正しい発行元で、自分宛てで、有効期間内」であることまで確認する。</p><h4>検証する項目</h4><table><tr><th>claim</th><th>確認すること</th></tr><tr><td><code>alg</code></td><td>RS256 などに<b class="key">固定</b>する。<code>none</code> を許さない</td></tr><tr><td><code>iss</code></td><td><code>http://localhost:8080/realms/myrealm</code> と一致するか</td></tr><tr><td><code>aud</code></td><td>自分(<code>backend-api</code>)が含まれるか</td></tr><tr><td><code>exp</code> / <code>nbf</code></td><td>現在時刻(許容 clock skew を含む)の範囲内か</td></tr><tr><td><code>typ</code></td><td><code>Bearer</code> か</td></tr><tr><td><code>azp</code></td><td>許可したクライアントか(必要なら)</td></tr><tr><td>scope / role</td><td>必要なものを持っているか</td></tr></table><h4>最後に認可する</h4><p>ここまで通ったら、<code>resource_access.backend-api.roles</code> に <code>write</code> があるか、といった確認で<b class="key">認可</b>する。</p><span class="trap">aud の確認を忘れると、署名は正しくても別の API 宛てのトークンまで受け入れてしまう。</span>`,
        oxIds: ['c10-ox-03', 'c10-ox-04'] },
      { id: 'c10-l01-p03', title: `検証の流れと 401 / 403 の使い分け`,
        html: `<p>ローカル検証の全体像をシーケンス図で見る。Keycloak が登場するのは、最初に JWKS を取得するときだけである。</p><pre>Client App          API (backend-api)                Keycloak
    │ GET /items           │                            │
    │ Authorization: Bearer &lt;access_token&gt;              │
    │─────────────────────&gt;│                            │
    │                      │ [first time / unknown kid only]
    │                      │ GET /certs (JWKS)          │
    │                      │───────────────────────────&gt;│
    │                      │&lt;── public keys (kid, n, e)─│
    │                      │ cache the keys             │
    │                      │ 1. read header: alg=RS256, kid=abc123
    │                      │ 2. pick the key with the same kid
    │                      │ 3. verify the signature   -&gt; NG: 401
    │                      │ 4. iss check              -&gt; NG: 401
    │                      │ 5. aud contains "backend-api" ? -&gt; NG: 401 (or 403)
    │                      │ 6. exp / nbf are valid ?  -&gt; NG: 401
    │                      │ 7. typ == Bearer ?        -&gt; NG: 401
    │                      │ 8. required role / scope ? -&gt; NG: 403
    │&lt;── 200 JSON ─────────│                            │</pre><h4>401 と 403</h4><ul><li>署名・iss・aud・exp/nbf・typ の確認に失敗 → <b class="key">401</b>(aud は 403 にする場合もある)</li><li>署名や claim は正しいが必要な role / scope が無い → <b class="key">403</b></li></ul><h4>この方式の性質</h4><ul><li>リクエストごとに Keycloak を呼ばないので<b class="key">速い</b></li><li><b class="key">失効したトークンでも exp までは通る</b></li><li>未知の kid(鍵ローテーション後)が来たら JWKS を一度だけ再取得する</li></ul><span class="trap">ログアウトやロール剥奪を即座に反映したい場合、この方式だけでは足りない。次の Introspection を使う。</span>`,
        oxIds: ['c10-ox-05', 'c10-ox-06'] }
    ] },
    { id: 'c10-l02', title: `Introspection・Userinfo・比較・実装例`, pages: [
      { id: 'c10-l02-p01', title: `Introspection で Keycloak に問い合わせる`,
        html: `<p>ローカル検証は失効に気づけない。そこで、トークンを Keycloak に直接見せて有効かを確認する方法が <b class="key">Introspection</b> である。ログアウトやロール剥奪を<b class="key">即時</b>に反映したいときに使う。</p><pre>curl -X POST .../token/introspect \\
  -u 'backend-api:secret' \\
  -d token=eyJ...</pre><ul><li>有効な場合の返り: <code>{"active": true, "sub": "...", "scope": "...", ...}</code></li><li>失効済みの場合: <code>{"active": false}</code></li></ul><h4>誰が呼ぶのか</h4><p>呼ぶ側は API であり、<b class="key">Confidential client</b> が必要である。<code>-u 'backend-api:secret'</code> のように、API 自身の client 認証を付けて問い合わせる。Keycloak は client 認証を確認し、署名・exp・セッションが生きているか・失効されていないかを調べて返す。</p><pre>Client App          API (backend-api)                Keycloak
    │ GET /items  Bearer &lt;token&gt;                        │
    │─────────────────────&gt;│ POST /token/introspect ───&gt;│
    │                      │&lt;── {"active":true,"sub":..,"scope":..}
    │&lt;── 200 JSON ─────────│                            │
    │ [after logout / role removal]                     │
    │ GET /items  Bearer &lt;same token&gt;                   │
    │─────────────────────&gt;│ POST /token/introspect ───&gt;│
    │                      │&lt;── {"active":false}        │
    │&lt;── 401 ──────────────│                            │</pre><span class="trap">Introspection は即時失効を反映できるが、リクエストごとに Keycloak への呼び出しが 1 回増える。</span>`,
        oxIds: ['c10-ox-07', 'c10-ox-08'] },
      { id: 'c10-l02-p02', title: `Userinfo と 2 つの方式の比較`,
        html: `<h4>Userinfo</h4><p><code>GET /userinfo</code> に Bearer トークンを付けて呼ぶと、<b class="key">プロフィール claim</b> を取得できる。ユーザーの情報を取りたいときのエンドポイントである。</p><h4>ローカル検証と Introspection の比較</h4><table><tr><th>方式</th><th>速さ</th><th>失効の反映</th></tr><tr><td><b class="key">ローカル JWT 検証</b></td><td>速い(Keycloak を呼ばない)</td><td>気づかない(exp まで)</td></tr><tr><td><b class="key">Introspection</b></td><td>遅い(毎回問い合わせる)</td><td>即時に反映される</td></tr></table><h4>どう選ぶか</h4><ul><li>速さを優先する → ローカル検証</li><li>ログアウト・ロール剥奪を即座に反映したい → Introspection</li></ul><span class="trap">「速さ」と「即時失効」は引き換えである。ローカル検証が即時失効まで担ってくれるわけではない。</span>`,
        oxIds: ['c10-ox-09', 'c10-ox-10'] },
      { id: 'c10-l02-p03', title: `主な言語・フレームワークでの実装例`,
        html: `<p>実際の実装では、チェックリストを自前で書くより、各言語のライブラリに任せることが多い。</p><table><tr><th>環境</th><th>使うもの</th></tr><tr><td>Spring Security</td><td><code>spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/myrealm</code></td></tr><tr><td>Node</td><td><code>jose</code> の <code>createRemoteJWKSet</code> + <code>jwtVerify(token, jwks, {issuer, audience})</code></td></tr><tr><td>Go</td><td><code>coreos/go-oidc</code></td></tr><tr><td>Python</td><td><code>PyJWT</code> + <code>PyJWKClient</code></td></tr></table><h4>Spring Security の場合</h4><ul><li><code>issuer-uri</code> から discovery して JWKS を<b class="key">自動取得</b>し、<b class="key">iss も自動で検証</b>される</li><li><b class="key">aud の検証は別途</b> <code>JwtValidator</code> を追加する必要がある</li></ul><h4>Node の場合</h4><p><code>createRemoteJWKSet</code> で JWKS を取得し、<code>jwtVerify</code> に <code>issuer</code> と <code>audience</code> を渡すことで、署名に加えて iss と aud も検証できる。</p><span class="trap">issuer-uri を設定しただけで安心せず、aud の検証が入っているかを確認する。</span>`,
        oxIds: ['c10-ox-11'] }
    ] }
  ],
  ox: [
    { id: 'c10-ox-01', text: `JWT のローカル検証では、API は JWKS を一度取得してキャッシュしておけば、リクエストのたびに Keycloak へ問い合わせなくてよい。`, answer: true,
      explain: `公開鍵をキャッシュして署名を<b class="key">API 自身で</b>検証するので、リクエストごとの Keycloak 呼び出しが不要になる。これが高速な理由である。`, lesson: 'c10-l01' },
    { id: 'c10-ox-02', text: `JWT の署名は、API がクライアントの secret を使って検証する。`, answer: false,
      explain: `誤り。署名の検証には、header の <code>kid</code> に合う JWKS の<b class="key">公開鍵</b>を使う。client secret は使わない。`, lesson: 'c10-l01' },
    { id: 'c10-ox-03', text: `署名が正しければ、aud に自分(backend-api)が含まれているかは確認しなくてよい。`, answer: false,
      explain: `誤り。署名が正しくても自分宛てとは限らない。<b class="key">aud</b> に自分が含まれるかも必ず検証する。`, lesson: 'c10-l01' },
    { id: 'c10-ox-04', text: `API は alg を RS256 などに固定し、alg が none のトークンを許さないようにする。`, answer: true,
      explain: `検証側で <b class="key">alg を固定</b>し、<code>none</code> を許さないことがチェックリストの最初の項目である。`, lesson: 'c10-l01' },
    { id: 'c10-ox-05', text: `ローカル検証では、ユーザーがログアウトした後でも、そのトークンの exp が切れるまでは API が受け入れてしまう。`, answer: true,
      explain: `ローカル検証は Keycloak に聞かないので、<b class="key">失効に気づけず exp まで通る</b>。即時失効が必要なら Introspection を使う。`, lesson: 'c10-l01' },
    { id: 'c10-ox-06', text: `署名も claim も正しいが、必要な role を持たないトークンに対して、API は 401 を返す。`, answer: false,
      explain: `誤り。認証に失敗したのではなく権限が足りないだけなので、返すのは <b class="key">403</b> である。401 は署名や iss・exp などの確認に失敗したときである。`, lesson: 'c10-l01' },
    { id: 'c10-ox-07', text: `Introspection を呼び出す API は、Confidential client として Keycloak に client 認証を付けて問い合わせる。`, answer: true,
      explain: `呼ぶ側の API は <b class="key">Confidential client</b> が必要で、<code>-u 'backend-api:secret'</code> のように自分の認証を付ける。`, lesson: 'c10-l02' },
    { id: 'c10-ox-08', text: `ユーザーがログアウトした後の access token を Introspection に渡すと、exp が切れるまで active: true が返る。`, answer: false,
      explain: `誤り。ログアウトやロール剥奪の後は <code>{"active": false}</code> が返り、API は 401 を返せる。これが <b class="key">即時失効</b>を反映できる理由である。`, lesson: 'c10-l02' },
    { id: 'c10-ox-09', text: `ローカル JWT 検証は Introspection より遅いが、トークンの失効を即時に反映できる。`, answer: false,
      explain: `速さと失効の反映が逆である。ローカル JWT 検証は<b class="key">速いが失効に気づかない</b>(exp まで)。Introspection は遅いが即時に反映される。`, lesson: 'c10-l02' },
    { id: 'c10-ox-10', text: `Userinfo エンドポイントは、Bearer トークンを付けて呼ぶと、ユーザーのプロフィール claim を返す。`, answer: true,
      explain: `<code>GET /userinfo</code> に Bearer を付けて呼び、<b class="key">プロフィール claim</b> を取得する。`, lesson: 'c10-l02' },
    { id: 'c10-ox-11', text: `Spring Security で issuer-uri を設定すれば、iss だけでなく aud の検証も自動で行われる。`, answer: false,
      explain: `誤り。<code>issuer-uri</code> からは JWKS の自動取得と <b class="key">iss の自動検証</b>までが行われる。<b class="key">aud の検証は別途</b> <code>JwtValidator</code> を追加する必要がある。`, lesson: 'c10-l02' }
  ],
  mc: [
    { id: 'c10-mc-01', stem: `【組合せ型】JWT のローカル検証に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `API は JWKS をキャッシュした公開鍵で署名を確認するため、リクエストごとに Keycloak へ問い合わせずに済む。` },
        { label: 'B', text: `署名と exp が正しければ、aud に自分が含まれているかは確認しなくてよい。` },
        { label: 'C', text: `header の kid に合う公開鍵で署名を検証し、未知の kid が来たときは JWKS を一度再取得する。` },
        { label: 'D', text: `ユーザーがログアウトしたトークンは、ローカル検証でも直ちに拒否される。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ 公開鍵をキャッシュして自分で署名を検証するので、毎回 Keycloak を呼ぶ必要はない。`,
        `B：× 署名が正しくても自分宛てとは限らない。<b class="key">aud</b> の検証も必要である。`,
        `C：○ kid で鍵を選び、鍵ローテーション後などで未知の kid が来たら JWKS を一度だけ再取得する。`,
        `D：× ローカル検証は Keycloak に聞かないため、失効したトークンでも exp までは通る。`
      ],
      tip: `ローカル検証は「署名と claim だけ」を見る。Keycloak の今の状態(ログアウトやロール剥奪)は知らない、と覚える。` },
    { id: 'c10-mc-02', stem: `【組合せ型】Introspection と Userinfo に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Introspection を呼ぶ API は、Public client として登録されていても問い合わせられる。` },
        { label: 'B', text: `Introspection は、ログアウトやロール剥奪を即時に反映でき、失効済みトークンには active が false で返る。` },
        { label: 'C', text: `Userinfo は、トークンの署名が正しいかを確認するためのエンドポイントである。` },
        { label: 'D', text: `Introspection では、API 自身が client 認証を付けて Keycloak にトークンを問い合わせる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× 呼ぶ側の API は <b class="key">Confidential client</b> が必要である。`,
        `B：○ 失効済みなら <code>{"active": false}</code> が返り、即時失効を反映できる。`,
        `C：× Userinfo はプロフィール claim を取得するためのエンドポイントである。`,
        `D：○ <code>-u 'backend-api:secret'</code> のように API 自身の client 認証を付ける。`
      ],
      tip: `Introspection は「API が自分の身元を示したうえで、Keycloak にトークンの生死を聞く」方式である。` },
    { id: 'c10-mc-03', stem: `【組合せ型】ローカル検証と Introspection の使い分けに関する次の記述のうち、誤っているものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `ログアウトやロール剥奪を即座に反映したいなら、ローカル検証のほうが適している。` },
        { label: 'B', text: `Introspection は、ローカル検証より速く、リクエストごとの Keycloak 呼び出しも要らない。` },
        { label: 'C', text: `ローカル検証は速いが、失効には exp まで気づけない。` },
        { label: 'D', text: `Introspection は、即時失効を反映できる代わりに、リクエストごとに余計な呼び出しが 1 回増える。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：× 誤りの記述。即時失効の反映に向くのは Introspection である。`,
        `B：× 誤りの記述。Introspection は遅く、毎回 Keycloak に問い合わせる。`,
        `C：○ 正しい記述。速さと引き換えに、失効に気づけない。`,
        `D：○ 正しい記述。即時反映の代償として 1 リクエストにつき 1 回の呼び出しが増える。`
      ],
      tip: `この問題は「誤っているもの」を選ぶ。速さ=ローカル、即時失効=Introspection の対応が逆になった文が誤りである。` },
    { id: 'c10-mc-04', stem: `【正誤選択型】API 側でのトークン検証に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'ローカル検証では、署名が正しければ iss や aud の確認は省略できる。',
        '署名の検証には、クライアントの secret を共通鍵として使う。',
        '必要なロールを持たないトークンには、署名が正しくても 403 を返して拒否する。',
        'alg は、検証するトークンの header に書かれた値にそのまま従うのがよい。',
        'Introspection はローカル検証より速いが、トークンの失効は反映されない。'
      ], answer: 3,
      explain: [
        `1：× 署名が正しくても、発行元(iss)や宛先(aud)が違えば受け入れてはいけない。`,
        `2：× 署名検証には JWKS の公開鍵を使う。secret は使わない。`,
        `3：○ 署名・claim が正しくても必要な role / scope が無い場合は <b class="key">403</b> で拒否する。`,
        `4：× alg は RS256 などに<b class="key">固定</b>し、<code>none</code> を許さない。`,
        `5：× 逆である。Introspection は遅いが即時失効を反映できる。速くて失効に気づけないのがローカル検証である。`
      ],
      tip: `認証の失敗(署名・iss・exp など)は 401、権限不足は 403、と原因で分けて考える。` },
    { id: 'c10-mc-05', stem: `【正誤選択型】Introspection に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'トークンを POST するだけでよく、client 認証は付けなくてよい。',
        'Public client として登録された API でも、Introspection を呼び出せる。',
        '応答には active だけが含まれ、sub や scope は含まれない。',
        'ログアウト後のトークンでも、exp が切れるまでは active が true で返る。',
        'ロールを剥奪されたユーザーのトークンを、API が即座に無効として扱える。'
      ], answer: 5,
      explain: [
        `1：× <code>-u 'backend-api:secret'</code> のように client 認証を付けて呼ぶ。`,
        `2：× 呼ぶ側の API は <b class="key">Confidential client</b> が必要である。`,
        `3：× 有効な場合は <code>active</code> に加えて <code>sub</code>・<code>scope</code> などが返る。`,
        `4：× ログアウト後は <code>{"active": false}</code> が返る。`,
        `5：○ ログアウトやロール剥奪を<b class="key">即時</b>に反映できるのが Introspection の利点である。`
      ],
      tip: `Introspection は「毎回 Keycloak に聞く」ので、聞いた時点の最新状態が返る。` },
    { id: 'c10-mc-06', stem: `【正誤選択型】API 側の検証の実装に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Spring Security で issuer-uri を設定すれば、aud の検証も自動で行われる。',
        'Spring Security で issuer-uri を設定すると、discovery から JWKS を自動取得し、iss も自動で検証される。',
        'Node の jose では、JWKS を手作業でファイルに保存してから検証する必要がある。',
        'Python の PyJWT は JWKS を扱えないため、Introspection を使うしかない。',
        'Node の jwtVerify に issuer や audience を渡しても、検証されるのは署名だけである。'
      ], answer: 2,
      explain: [
        `1：× aud の検証は別途 <code>JwtValidator</code> を追加する必要がある。`,
        `2：○ <code>issuer-uri</code> から discovery で JWKS を取得し、<b class="key">iss も自動検証</b>される。`,
        `3：× <code>createRemoteJWKSet</code> で JWKS を取得できる。`,
        `4：× Python では <code>PyJWT</code> と <code>PyJWKClient</code> を組み合わせて検証できる。`,
        `5：× <code>jwtVerify(token, jwks, {issuer, audience})</code> のように、iss と aud も検証できる。`
      ],
      tip: `ライブラリは「どこまで自動でやってくれるか」を確認する。iss は自動でも、aud は別途追加が必要な場合がある。` }
  ]
});
DATA.chapters.push({
  no: 11, title: `ユーザー・ロール・グループ`,
  lessons: [
    { id: 'c11-l01', title: `User と Role`, pages: [
      { id: 'c11-l01-p01', title: `User とは・基本プロフィール項目`,
        html: `<p><b class="key">User</b> はログインする人を表す。後述の Service Account もユーザーの一種として扱われる。まず基本の項目と、トークンに載る claim の対応を押さえる。</p><h4>主な項目と claim</h4><table><tr><th>項目</th><th>意味</th><th>claim</th></tr><tr><td><b class="key">Username</b></td><td>ログイン名。realm 内で一意</td><td><code>preferred_username</code></td></tr><tr><td>Email / First name / Last name</td><td>基本プロフィール</td><td><code>email</code>, <code>given_name</code>, <code>family_name</code></td></tr><tr><td>Email verified</td><td>メール確認済みか</td><td><code>email_verified</code></td></tr><tr><td><b class="key">Enabled</b></td><td>OFF にするとログインできない</td><td>-</td></tr><tr><td><b class="key">Attributes</b></td><td>管理者が自由に足せる key-value(部署など)</td><td>User Attribute Mapper で claim にできる</td></tr></table><span class="trap">Attributes は自由に足せるが、値を入れただけで claim になるわけではない。claim にするには User Attribute Mapper が要る。</span>`,
        oxIds: ['c11-ox-01', 'c11-ox-02'] },
      { id: 'c11-l01-p02', title: `User 画面の各タブと User Profile`,
        html: `<p>ユーザーの詳細画面は、目的ごとのタブに分かれている。何をどこで操作するかを整理しておく。</p><h4>各タブの役割</h4><ul><li><b class="key">Credentials</b> タブ: パスワード、OTP、パスキー(WebAuthn)の登録・リセット</li><li><b class="key">Required user actions</b>: 次回ログイン時に必ずやらせること(後述)</li><li><b class="key">Role mapping</b> タブ: 付与されているロール</li><li><b class="key">Groups</b> タブ: 所属グループ</li><li><b class="key">Sessions / Consents</b> タブ: ログイン中セッションの確認・強制終了 / 同意の履歴</li><li><b class="key">Identity provider links</b>: Google など外部アカウントとの紐付け</li></ul><h4>User Profile</h4><p>Realm settings にある機能で、<b class="key">どの項目を必須にするか</b>、<b class="key">ユーザー自身が編集できるか</b>を定義する。v24 以降で標準になっている。</p>`,
        oxIds: ['c11-ox-03'] },
      { id: 'c11-l01-p03', title: `Realm Role と Client Role`,
        html: `<p><b class="key">Role</b> は「何をしてよいか」を表す<b class="key">名前付きのラベル</b>である(例: <code>admin</code>, <code>read</code>)。ロールには置き場所の違いで 2 種類ある。</p><h4>2 種類の違い</h4><table><tr><th>種類</th><th>範囲</th><th>トークンでの場所</th><th>例</th></tr><tr><td><b class="key">Realm Role</b></td><td>realm 全体で共通</td><td><code>realm_access.roles</code></td><td><code>admin</code>, <code>user</code></td></tr><tr><td><b class="key">Client Role</b></td><td>特定のクライアント(アプリ/API)専用</td><td><code>resource_access.backend-api.roles</code></td><td><code>backend-api</code> の <code>read</code></td></tr></table><h4>どう使い分けるか</h4><p>「このアプリの中での権限」を表すときは Client Role を使うと、他のアプリのロール名との<b class="key">衝突を避けられる</b>。同じ <code>read</code> という名前でも、<code>backend-api</code> の <code>read</code> として区別できるからである。</p><span class="trap">realm_access と resource_access を取り違えない。Realm Role は realm_access、Client Role は resource_access に入る。</span>`,
        oxIds: ['c11-ox-04', 'c11-ox-05'] },
      { id: 'c11-l01-p04', title: `Composite Role・Default Roles と「トークンに載らない」問題`,
        html: `<h4>Composite Role(複合ロール)</h4><p>他のロールを<b class="key">束ねたロール</b>である。例: <code>manager</code> = <code>read</code> + <code>write</code> + <code>approve</code>。職務に合わせたロールを作るのに向く。</p><h4>Default Roles</h4><p>新規ユーザーに<b class="key">自動で付与</b>されるロールで、<code>default-roles-myrealm</code> がそれにあたる。<code>offline_access</code> などが含まれる。</p><h4>ロールを付ける場所</h4><p>ロールはユーザー、グループ、(Service Account)に付ける。</p><h4>付与しただけでは載らないことがある</h4><p>ロールは<b class="key">付与されただけではトークンに載らない場合</b>がある。Client Scope の Role scope mapping や Full Scope Allowed の影響を受けるためで、詳しくは第4章で扱った。</p><span class="trap">「ロールを付けたのにトークンに出ない」ときは、付与の有無だけでなく Client Scope 側の設定も疑う。</span>`,
        oxIds: ['c11-ox-06', 'c11-ox-07'] }
    ] },
    { id: 'c11-l02', title: `Group・Service Account・Required Actions・Organizations・ロール設計指針`, pages: [
      { id: 'c11-l02-p01', title: `Group と Role の使い分け`,
        html: `<p><b class="key">Group</b> は、ユーザーをまとめる入れ物である。<b class="key">階層構造</b>を作れる(例: <code>/company/dev</code>)。</p><h4>グループでできること</h4><ul><li>グループに<b class="key">ロール</b>を付けると、メンバー全員に継承される</li><li>グループに<b class="key">属性</b>を持たせると、メンバーに継承される</li></ul><h4>使い分けの目安</h4><table><tr><th>表したいこと</th><th>使うもの</th></tr><tr><td>組織・チームの所属</td><td><b class="key">Group</b></td></tr><tr><td>権限の種類</td><td><b class="key">Role</b></td></tr></table><p>例: グループ <code>/sales</code> にロール <code>crm-user</code> を付けると、営業の全員が CRM を使えるようになる。</p><span class="trap">グループの所属は自動ではトークンに載らない。載せるには Group Membership Mapper が必要である。</span>`,
        oxIds: ['c11-ox-08', 'c11-ox-09'] },
      { id: 'c11-l02-p02', title: `Service Account と Required Actions`,
        html: `<h4>Service Account</h4><p>Client Credentials Flow 用に、Keycloak が<b class="key">クライアントごとに自動作成する内部ユーザー</b>である。名前は <code>service-account-&lt;client_id&gt;</code> になる。ロールは、その Client の「<b class="key">Service accounts roles</b>」タブで付ける。</p><h4>Required Actions(必須アクション)</h4><p>ユーザーが次回ログインしたとき、<b class="key">ログイン前に必ずやらせる作業</b>である。例を挙げる。</p><ul><li><b class="key">Update Password</b>: パスワード変更</li><li><b class="key">Verify Email</b>: メール確認</li><li><b class="key">Configure OTP</b>: ワンタイムパスワード設定</li><li><b class="key">Update Profile</b>: プロフィール入力</li><li><b class="key">Terms and Conditions</b>: 利用規約への同意</li></ul><span class="trap">Required Actions が残っていると、<code>Account is not fully set up</code> でログインが詰まることがある。</span>`,
        oxIds: ['c11-ox-10', 'c11-ox-11'] },
      { id: 'c11-l02-p03', title: `Organizations とロール設計の指針`,
        html: `<h4>Organizations (v26)</h4><p><b class="key">B2B 向け</b>の機能で、顧客企業(組織)ごとに<b class="key">ユーザーとログイン元 IdP をまとめる</b>。メンバーの所属組織は <code>organization</code> claim で返せる。</p><h4>ロール設計の指針</h4><ol><li>API ごとに <b class="key">Client Role</b> を作る。トークンの <code>aud</code> と自然に整合する</li><li>人の所属は <b class="key">Group</b>、権限は <b class="key">Role</b> にして、Group に Role を付ける</li><li>管理しやすいよう <b class="key">Composite Role</b> で「職務ロール」を作る</li></ol><span class="trap">所属(Group)と権限(Role)を混ぜない。役割を分けるほど、人の異動や権限の見直しが管理しやすくなる。</span>`,
        oxIds: ['c11-ox-12'] }
    ] }
  ],
  ox: [
    { id: 'c11-ox-01', text: `ユーザーの Username は realm 内で一意であり、トークンでは preferred_username claim になる。`, answer: true,
      explain: `Username はログイン名で、<b class="key">realm 内で一意</b>。トークンでは <code>preferred_username</code> として出る。`, lesson: 'c11-l01' },
    { id: 'c11-ox-02', text: `ユーザーの Attributes に部署などの値を入れると、Mapper を設定しなくても自動的にトークンの claim になる。`, answer: false,
      explain: `誤り。Attributes は管理者が自由に足せる key-value だが、claim にするには <b class="key">User Attribute Mapper</b> が必要である。`, lesson: 'c11-l01' },
    { id: 'c11-ox-03', text: `User Profile を使うと、どの項目を必須にするか、ユーザー自身が編集できるかを realm として定義できる。`, answer: true,
      explain: `User Profile(Realm settings)は、<b class="key">必須項目</b>と<b class="key">ユーザー自身の編集可否</b>を定義する機能である。`, lesson: 'c11-l01' },
    { id: 'c11-ox-04', text: `アプリ内の権限を表すときに Client Role を使うと、他のアプリのロール名との衝突を避けやすい。`, answer: true,
      explain: `Client Role は特定のクライアント専用なので、同じ名前のロールがあっても <code>backend-api</code> の <code>read</code> のように区別でき、<b class="key">名前の衝突を避けられる</b>。`, lesson: 'c11-l01' },
    { id: 'c11-ox-05', text: `Realm Role は、トークンでは resource_access 配下にクライアントごとに入る。`, answer: false,
      explain: `誤り。Realm Role は <b class="key">realm_access.roles</b> に入る。クライアントごとに入る <code>resource_access</code> は Client Role のほうである。`, lesson: 'c11-l01' },
    { id: 'c11-ox-06', text: `Composite Role は他のロールを束ねたロールで、たとえば manager に read・write・approve をまとめることができる。`, answer: true,
      explain: `<b class="key">Composite Role</b> は他のロールを束ねたロールで、職務に合わせたロールを作るのに向く。`, lesson: 'c11-l01' },
    { id: 'c11-ox-07', text: `ロールをユーザーに付与すれば、そのロールは必ずアクセストークンに載る。`, answer: false,
      explain: `誤り。ロールは付与されただけではトークンに載らない場合があり、Client Scope の <b class="key">Role scope mapping / Full Scope Allowed</b> の影響を受ける。`, lesson: 'c11-l01' },
    { id: 'c11-ox-08', text: `グループにロールを付けると、そのグループのメンバー全員にロールが継承される。`, answer: true,
      explain: `グループに付けたロール(や属性)は<b class="key">メンバー全員に継承</b>される。例: <code>/sales</code> に <code>crm-user</code> を付ければ営業全員が CRM を使える。`, lesson: 'c11-l02' },
    { id: 'c11-ox-09', text: `ユーザーをグループに入れると、そのグループの所属は自動的にトークンに載る。`, answer: false,
      explain: `誤り。グループをトークンに載せるには <b class="key">Group Membership Mapper</b> が必要で、自動では載らない。`, lesson: 'c11-l02' },
    { id: 'c11-ox-10', text: `Service Account は、Client Credentials Flow を使うために、管理者がクライアントとは別に手作業でユーザーとして作成する。`, answer: false,
      explain: `誤り。Service Account は Keycloak が<b class="key">クライアントごとに自動作成</b>する内部ユーザーで、名前は <code>service-account-&lt;client_id&gt;</code> になる。`, lesson: 'c11-l02' },
    { id: 'c11-ox-11', text: `Required Actions が残っているユーザーは、ログイン前にその作業を済ませる必要があり、未完了だと Account is not fully set up で止まることがある。`, answer: true,
      explain: `<b class="key">Required Actions</b> は次回ログイン時にログイン前にやらせる作業で、残っているとログインが詰まることがある。`, lesson: 'c11-l02' },
    { id: 'c11-ox-12', text: `ロール設計では、人の所属は Role、権限の種類は Group で表し、Role に Group を付けるのが管理しやすい。`, answer: false,
      explain: `役割が逆である。人の所属は <b class="key">Group</b>、権限は <b class="key">Role</b> で表し、Group に Role を付けるのが管理しやすい。`, lesson: 'c11-l02' }
  ],
  mc: [
    { id: 'c11-mc-01', stem: `【組合せ型】Role に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Realm Role は、トークンでは resource_access 配下にクライアントごとに入る。` },
        { label: 'B', text: `Client Role は特定のクライアント専用のロールで、トークンでは resource_access.&lt;クライアント名&gt;.roles に入る。` },
        { label: 'C', text: `Composite Role は他のロールを束ねたロールで、manager = read + write + approve のような職務ロールを作れる。` },
        { label: 'D', text: `Default Roles は、管理者が個別に付与したユーザーだけに付くロールである。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× Realm Role は <code>realm_access.roles</code> に入る。resource_access に入るのは Client Role である。`,
        `B：○ Client Role は特定クライアント専用で、<code>resource_access</code> 配下に入る。`,
        `C：○ Composite Role は他のロールを束ねたもので、職務ロールの作成に向く。`,
        `D：× Default Roles は<b class="key">新規ユーザーに自動付与</b>されるロールである。`
      ],
      tip: `realm_access は「realm 共通」、resource_access は「リソース(クライアント)ごと」と名前から対応づける。` },
    { id: 'c11-mc-02', stem: `【組合せ型】ロールや Group がトークンに載るかどうかに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `ロールをユーザーに付与しただけではトークンに載らない場合があり、Client Scope の Role scope mapping や Full Scope Allowed の影響を受ける。` },
        { label: 'B', text: `Group の所属をトークンに載せるには、Group Membership Mapper が必要である。` },
        { label: 'C', text: `グループに付けたロールは、グループのメンバーには継承されない。` },
        { label: 'D', text: `User Attribute は、Mapper を設定しなくても自動的に claim として出力される。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：○ 付与とトークンへの出力は別で、Client Scope 側の設定が影響する。`,
        `B：○ Group は自動では載らず、<b class="key">Group Membership Mapper</b> が必要である。`,
        `C：× グループに付けたロールはメンバー全員に継承される。`,
        `D：× Attribute を claim にするには <b class="key">User Attribute Mapper</b> が必要である。`
      ],
      tip: `Keycloak 内にある情報(ロール・Group・Attribute)は、Mapper や Client Scope を通って初めてトークンに出る、と捉える。` },
    { id: 'c11-mc-03', stem: `【組合せ型】Service Account と Required Actions に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Service Account は、管理者がユーザーとして手作業で作り、名前も自由に決められる。` },
        { label: 'B', text: `Required Actions は、ユーザーがログインした後に、任意のタイミングで実行できる作業である。` },
        { label: 'C', text: `Service Account は、Client Credentials Flow 用に Keycloak がクライアントごとに自動作成する内部ユーザーである。` },
        { label: 'D', text: `Required Actions が残っていると、ログインが Account is not fully set up で詰まることがある。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× Service Account は自動作成で、名前は <code>service-account-&lt;client_id&gt;</code> になる。`,
        `B：× Required Actions は<b class="key">ログイン前に必ず</b>やらせる作業である。`,
        `C：○ Client ごとに自動作成される内部ユーザーで、ロールは「Service accounts roles」タブで付ける。`,
        `D：○ 未完了の Required Actions があるとログインが止まることがある。`
      ],
      tip: `Service Account は「クライアント自身がログインする人(ユーザー)の代役」として自動で用意される、と覚える。` },
    { id: 'c11-mc-04', stem: `【組合せ型】Group・Role・Organizations の設計に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `組織・チームの所属は Role、権限の種類は Group で表すのが目安である。` },
        { label: 'B', text: `人の所属は Group、権限は Role で表し、Group に Role を付ける設計は管理しやすい。` },
        { label: 'C', text: `Organizations は、顧客企業ごとにユーザーを分けるが、ログイン元 IdP は realm 全体で共通になる。` },
        { label: 'D', text: `API ごとに Client Role を作ると、トークンの aud と自然に整合する。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× 逆である。所属は <b class="key">Group</b>、権限の種類は <b class="key">Role</b> で表す。`,
        `B：○ Group に Role を付ければ、メンバー全員に継承され管理しやすい。`,
        `C：× Organizations は顧客企業ごとに<b class="key">ユーザーとログイン元 IdP</b>をまとめる機能である。`,
        `D：○ API ごとの Client Role は、その API を指す aud と整合しやすい。`
      ],
      tip: `「誰が(Group)」と「何をしてよいか(Role)」を分けて持ち、間を Group への Role 付与でつなぐ。` },
    { id: 'c11-mc-05', stem: `【正誤選択型】User に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Username は realm をまたいで一意であり、email claim になる。',
        'Enabled を OFF にしたユーザーは、ログインできなくなる。',
        'Attributes は、Keycloak が定めた項目だけを追加できる key-value である。',
        'Sessions / Consents タブでは、ログイン中のセッションを強制終了することはできない。',
        'Identity provider links は、ユーザーが所属するグループを表す。'
      ], answer: 2,
      explain: [
        `1：× Username は<b class="key">realm 内</b>で一意で、claim は <code>preferred_username</code> である。`,
        `2：○ Enabled を OFF にするとログインできない。`,
        `3：× Attributes は管理者が<b class="key">自由に</b>足せる key-value である。`,
        `4：× Sessions タブでは、ログイン中セッションの確認と強制終了ができる。`,
        `5：× Identity provider links は、Google など外部アカウントとの紐付けである。所属グループは Groups タブで見る。`
      ],
      tip: `User の画面は「何を確認・操作するか」ごとにタブが分かれている。名前と役割を対にして覚える。` },
    { id: 'c11-mc-06', stem: `【正誤選択型】Realm Role と Client Role の使い分けに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Client Role は realm 全体で共通の権限を表すもので、トークンでは realm_access.roles に入る。',
        'Realm Role は特定のアプリ内の権限を表すのに向き、アプリ間のロール名の衝突を避けられる。',
        'Client Role は特定のクライアント専用で、アプリ内の権限を表すと名前の衝突を避けやすい。',
        'Default Roles は新規ユーザーには付かず、管理者が手動で付けるまで空である。',
        'Composite Role は、ロールをユーザーに付けず、グループにだけ付けるための仕組みである。'
      ], answer: 3,
      explain: [
        `1：× realm 全体共通で <code>realm_access.roles</code> に入るのは Realm Role である。`,
        `2：× アプリ内の権限を表すのに向き、名前の衝突を避けられるのは Client Role である。`,
        `3：○ Client Role は特定クライアント専用なので、<b class="key">名前の衝突を避けやすい</b>。`,
        `4：× Default Roles は新規ユーザーに<b class="key">自動付与</b>される。`,
        `5：× Composite Role は他のロールを束ねたロールである。付与先はユーザー・グループ・Service Account のいずれでもよい。`
      ],
      tip: `Realm Role は「realm 共通の名札」、Client Role は「そのアプリ専用の名札」と覚える。` },
    { id: 'c11-mc-07', stem: `【正誤選択型】Group に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'グループにロールを付けると、メンバー全員にそのロールが継承される。',
        'グループは階層を作れないため、/company/dev のような構造は表せない。',
        'ユーザーをグループに入れると、グループの所属は自動的にトークンに載る。',
        'グループに持たせた属性は、メンバーには継承されない。',
        'グループは権限の種類を表すもので、Role は組織の所属を表す。'
      ], answer: 1,
      explain: [
        `1：○ グループに付けたロールはメンバー全員に継承される。`,
        `2：× グループは<b class="key">階層構造</b>を作れ、<code>/company/dev</code> のように表せる。`,
        `3：× 載せるには Group Membership Mapper が必要で、自動では載らない。`,
        `4：× グループの属性もメンバーに継承される。`,
        `5：× 逆である。所属は Group、権限の種類は Role で表す。`
      ],
      tip: `Group は「人の束」、Role は「権限の束」。Group に Role を付けると人の束に権限が一括で届く。` }
  ]
});
DATA.chapters.push({
  no: 12, title: `認証フロー(Authentication Flows)`,
  lessons: [
    { id: 'c12-l01', title: `Flow の構成要素・標準フロー・Execution`, pages: [
      { id: 'c12-l01-p01', title: `Authentication Flow とは何か`,
        html: `<p><b class="key">Authentication Flow</b> は、ログイン時に<b class="key">どの確認をどの順番でやるか</b>を定義した手順書である。場所は Authentication → Flows にある。</p><p>例: 「Cookie があれば即ログイン → 無ければ ID/パスワード → 必要なら OTP」。</p><h4>OAuth の Flow とは別物</h4><table><tr><th>名前</th><th>何を決めるか</th></tr><tr><td>OAuth Flow(Authorization Code Flow など)</td><td>アプリとの<b class="key">通信手順</b></td></tr><tr><td>Authentication Flow</td><td><b class="key">本人確認の手順</b>(Keycloak 内部の画面遷移)</td></tr></table><span class="trap">どちらも「Flow」と呼ぶが別物である。Authorization Code Flow はアプリとの通信手順、Authentication Flow は Keycloak 内で本人確認をどう進めるかの手順である。</span>`,
        oxIds: ['c12-ox-01', 'c12-ox-02'] },
      { id: 'c12-l01-p02', title: `構成要素と Requirement`,
        html: `<p>Authentication Flow は 3 つの部品でできている。</p><h4>構成要素</h4><ul><li><b class="key">Flow</b>: 手順全体(例: <code>browser</code>)</li><li><b class="key">Sub-flow</b>: 手順の中のグループ化(例: <code>forms</code>)</li><li><b class="key">Execution</b>: 1つの確認ステップ(例: 「Username Password Form」「OTP Form」)</li></ul><h4>Requirement(各ステップの扱い)</h4><table><tr><th>Requirement</th><th>意味</th></tr><tr><td><b class="key">Required</b></td><td>必ず成功させる</td></tr><tr><td><b class="key">Alternative</b></td><td>並んだ候補のうち<b class="key">どれか1つ</b>成功すればよい(Cookie / Passkey / パスワード など)</td></tr><tr><td><b class="key">Conditional</b></td><td>条件(Condition)を満たす時だけ実行</td></tr><tr><td><b class="key">Disabled</b></td><td>無効</td></tr></table><span class="trap">Alternative は「全部成功」ではなく「どれか1つ成功」である。Required と取り違えない。</span>`,
        oxIds: ['c12-ox-03', 'c12-ox-04'] },
      { id: 'c12-l01-p03', title: `標準フローと主な Execution`,
        html: `<h4>標準で入っているフロー</h4><table><tr><th>フロー</th><th>役割</th></tr><tr><td><b class="key">browser</b></td><td>ブラウザでのログイン画面の手順(一番よく使う)</td></tr><tr><td><b class="key">direct grant</b></td><td>Password Grant 用(画面なし)</td></tr><tr><td><b class="key">registration</b></td><td>新規ユーザー登録</td></tr><tr><td><b class="key">reset credentials</b></td><td>パスワード忘れの再設定</td></tr><tr><td><b class="key">first broker login</b></td><td>外部 IdP で<b class="key">初めて</b>ログインしたときの処理(ユーザー作成 or 既存と紐付け)</td></tr><tr><td><b class="key">post broker login</b></td><td>外部 IdP ログイン後の追加処理</td></tr><tr><td><b class="key">clients</b></td><td>クライアント認証の手順(secret / JWT / mTLS)</td></tr></table><p>ほかに特殊用途の <code>docker auth</code> / <code>http challenge</code> がある。</p><h4>主な Execution</h4><p><b class="key">Cookie</b>(SSO Cookie があれば通す)、<b class="key">Identity Provider Redirector</b>(外部 IdP へ自動転送)、<b class="key">Username Password Form</b>、<b class="key">OTP Form</b>、<b class="key">WebAuthn Authenticator / Passkeys</b>、<b class="key">Recovery Authentication Code Form</b>(バックアップコード)、<b class="key">Conditional OTP / Condition - user role</b>(条件付き)など。browser フローは Cookie → Identity Provider Redirector → Username/Password → (条件付き) OTP の順で進む。</p><span class="trap">標準フローは直接編集できない。Duplicate してコピーを編集し、Bind flow で適用する。</span>`,
        oxIds: ['c12-ox-05', 'c12-ox-06'] }
    ] },
    { id: 'c12-l02', title: `認証強化機能・設定例`, pages: [
      { id: 'c12-l02-p01', title: `認証を強くする機能`,
        html: `<p>Authentication Flow の仕組みの上で、ログインを強くする機能が用意されている。</p><h4>MFA(多要素認証)</h4><p>TOTP(Google Authenticator などの 6 桁コード)、WebAuthn/Passkeys、リカバリーコードが使える。</p><h4>Step-up Authentication(段階的認証)</h4><p><b class="key">重要な操作の時だけ</b>強い認証を要求する。アプリが <code>acr_values=gold</code> のように要求すると、Keycloak が MFA を追加で実施し、結果が <b class="key">acr claim</b> に反映される。Realm settings の「ACR to LoA mapping」で、<code>gold</code> = Level 2 のように対応づける。</p><h4>Brute Force Detection</h4><p>連続ログイン失敗で、アカウントを<b class="key">一時または永久にロック</b>する(Realm settings → Security defenses)。</p><h4>Password Policy</h4><p>最小長、大文字小文字、過去パスワードの再利用禁止、ユーザー名と同じ禁止などを決める(Authentication → Policies)。</p><span class="trap">Brute Force Detection は「失敗の繰り返しへの対策」、Password Policy は「パスワードの中身のルール」である。</span>`,
        oxIds: ['c12-ox-07', 'c12-ox-08'] },
      { id: 'c12-l02-p02', title: `設定例: 管理者だけ MFA を必須にする`,
        html: `<p>「管理者ロールの人だけ MFA を必須にする」設定を、手順で追う。</p><h4>手順</h4><ol><li><code>browser</code> フローを <b class="key">Duplicate</b> する</li><li><code>forms</code> の中に Sub-flow「Admin OTP」を追加する(Requirement = <b class="key">Conditional</b>)</li><li>Sub-flow 内に「Condition - user role (admin)」= Required と「OTP Form」= Required を置く</li><li><b class="key">Bind flow</b> で browser フローに設定する</li></ol><h4>できあがりの構造</h4><pre>browser (Duplicate したコピー)
 └ forms
    └ Admin OTP (Sub-flow, Conditional)
       ├ Condition - user role (admin)  Required
       └ OTP Form                       Required</pre><p>Sub-flow が Conditional なので、条件(admin ロールを持つ)を満たすユーザーのときだけ OTP が実行される。</p><span class="trap">標準フローを直接編集するのではなく、Duplicate したコピーを編集して Bind flow で適用する。</span>`,
        oxIds: ['c12-ox-09'] }
    ] }
  ],
  ox: [
    { id: 'c12-ox-01', text: `Authentication Flow は、Authorization Code Flow と同じく、アプリと Keycloak の間の通信手順を定めるものである。`, answer: false,
      explain: `誤り。Authentication Flow は Keycloak 内部での<b class="key">本人確認の手順</b>(画面遷移)である。アプリとの通信手順を定めるのは OAuth の Flow である。`, lesson: 'c12-l01' },
    { id: 'c12-ox-02', text: `「SSO Cookie があれば即ログイン、無ければ ID/パスワード、必要なら OTP」という確認の順序は、Authentication Flow で定義できる。`, answer: true,
      explain: `Authentication Flow は<b class="key">どの確認をどの順番でやるか</b>を定義する手順書で、この例がまさにその使い方である。`, lesson: 'c12-l01' },
    { id: 'c12-ox-03', text: `Requirement が Alternative のステップが並んでいる場合、すべてのステップに成功しなければならない。`, answer: false,
      explain: `誤り。Alternative は並んだ候補のうち<b class="key">どれか1つ</b>成功すればよい。全部成功させるのは Required である。`, lesson: 'c12-l01' },
    { id: 'c12-ox-04', text: `Requirement が Conditional のステップは、条件(Condition)を満たす時だけ実行される。`, answer: true,
      explain: `<b class="key">Conditional</b> は条件を満たす時だけ実行する設定である。`, lesson: 'c12-l01' },
    { id: 'c12-ox-05', text: `標準フローの内容を変えたいときは、Duplicate したコピーを編集し、Bind flow で適用する。`, answer: true,
      explain: `標準フローは<b class="key">直接編集できない</b>ので、Duplicate してコピーを編集し、Bind flow で適用する。`, lesson: 'c12-l01' },
    { id: 'c12-ox-06', text: `direct grant フローは、外部 IdP で初めてログインしたユーザーの作成や既存ユーザーとの紐付けを行う。`, answer: false,
      explain: `誤り。それは <b class="key">first broker login</b> の役割である。direct grant は Password Grant 用の画面なしのフローである。`, lesson: 'c12-l01' },
    { id: 'c12-ox-07', text: `Step-up Authentication では、アプリが acr_values を要求すると Keycloak が MFA を追加で実施し、結果が acr claim に反映される。`, answer: true,
      explain: `重要な操作の時だけ強い認証を求める仕組みで、アプリの <code>acr_values</code> 要求 → MFA 追加 → <b class="key">acr claim</b> に反映、という流れである。`, lesson: 'c12-l02' },
    { id: 'c12-ox-08', text: `Password Policy は、連続ログイン失敗でアカウントをロックする機能である。`, answer: false,
      explain: `誤り。連続失敗でロックするのは <b class="key">Brute Force Detection</b> である。Password Policy は最小長や再利用禁止などパスワードの中身のルールである。`, lesson: 'c12-l02' },
    { id: 'c12-ox-09', text: `管理者ロールの人だけ MFA を必須にする設定では、Sub-flow「Admin OTP」の Requirement を Alternative にする。`, answer: false,
      explain: `誤り。Sub-flow の Requirement は <b class="key">Conditional</b> にし、中に「Condition - user role (admin)」と「OTP Form」を Required で置く。`, lesson: 'c12-l02' }
  ],
  mc: [
    { id: 'c12-mc-01', stem: `【組合せ型】Authentication Flow の基本に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Authentication Flow は、Authorization Code Flow と同じく、アプリと Keycloak の間の通信手順を定義する。` },
        { label: 'B', text: `Flow・Sub-flow・Execution のうち、1つの確認ステップを表すのは Sub-flow である。` },
        { label: 'C', text: `Authentication Flow は、ログイン時にどの確認をどの順番でやるかを定義した手順書で、OAuth の Flow とは別物である。` },
        { label: 'D', text: `Flow は手順全体、Sub-flow は手順の中のグループ化、Execution は 1つの確認ステップである。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× 通信手順を定めるのは OAuth の Flow である。Authentication Flow は<b class="key">本人確認の手順</b>である。`,
        `B：× 1つの確認ステップは <b class="key">Execution</b> である。Sub-flow はグループ化である。`,
        `C：○ 本人確認の手順書であり、OAuth の Flow とは別物である。`,
        `D：○ 3 つの部品の役割の説明として正しい。`
      ],
      tip: `Authentication Flow は「Keycloak の中で本人確認をどう進めるか」、OAuth Flow は「アプリとどう通信するか」と、舞台で分ける。` },
    { id: 'c12-mc-02', stem: `【組合せ型】Requirement に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Alternative は、並んだ候補のうちどれか 1つが成功すればよい。` },
        { label: 'B', text: `Required は、条件を満たす時だけ実行される。` },
        { label: 'C', text: `Conditional は、条件(Condition)を満たす時だけ実行される。` },
        { label: 'D', text: `Disabled は、必ず成功させなければならない設定である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ Cookie / Passkey / パスワードのように、どれか 1つで通れる。`,
        `B：× Required は<b class="key">必ず成功させる</b>設定である。条件付きなのは Conditional である。`,
        `C：○ Condition を満たす時だけ実行する。`,
        `D：× Disabled は無効にする設定で、実行されない。`
      ],
      tip: `Required=必須、Alternative=どれか1つ、Conditional=条件つき、Disabled=無効。名前をそのまま意味に結びつける。` },
    { id: 'c12-mc-03', stem: `【組合せ型】標準フローに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `標準フローは直接編集して使うのが前提で、Duplicate は不要である。` },
        { label: 'B', text: `browser フローは Cookie → Identity Provider Redirector → Username/Password → (条件付き) OTP の順で進み、SSO 済みなら画面なしで通る。` },
        { label: 'C', text: `direct grant フローは、ブラウザのログイン画面を出す標準フローである。` },
        { label: 'D', text: `first broker login は、外部 IdP で初めてログインしたときの処理(ユーザー作成 or 既存との紐付け)である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× 標準フローは直接編集できない。Duplicate してコピーを編集し、Bind flow で適用する。`,
        `B：○ browser フローの順序と、Cookie による SSO の説明として正しい。`,
        `C：× direct grant は Password Grant 用で<b class="key">画面なし</b>のフローである。`,
        `D：○ 外部 IdP との初回ログイン時の処理である。`
      ],
      tip: `フロー名は「どの場面の手順か」(browser=画面、direct grant=画面なし、first broker login=外部 IdP 初回)で覚える。` },
    { id: 'c12-mc-04', stem: `【正誤選択型】認証を強くする機能に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Step-up Authentication では、アプリが acr_values を要求し、MFA を追加で実施した結果が acr claim に反映される。',
        'Brute Force Detection は、パスワードの最小長や再利用禁止を強制する機能である。',
        'Password Policy は、連続ログイン失敗でアカウントをロックする機能である。',
        'Step-up Authentication は、すべてのログインで常に強い認証を要求する機能である。',
        'ACR to LoA mapping は、ロールをクライアントに対応づける設定である。'
      ], answer: 1,
      explain: [
        `1：○ <code>acr_values</code> の要求 → MFA 追加 → <b class="key">acr claim</b> に反映、という流れである。`,
        `2：× それは Password Policy の役割である。Brute Force Detection は連続失敗でのロックである。`,
        `3：× それは Brute Force Detection の役割である。`,
        `4：× Step-up は<b class="key">重要な操作の時だけ</b>強い認証を要求する。`,
        `5：× ACR to LoA mapping は、<code>gold</code> = Level 2 のように acr の値とレベルを対応づける設定である。`
      ],
      tip: `「失敗を繰り返す攻撃への対策(Brute Force)」と「パスワードの中身のルール(Password Policy)」は守る対象が違う。` },
    { id: 'c12-mc-05', stem: `【正誤選択型】「管理者ロールの人だけ MFA を必須にする」設定に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        '標準の browser フローを直接編集して Sub-flow を追加する。',
        'Sub-flow「Admin OTP」の Requirement を Required にして、全員に OTP を課す。',
        'Sub-flow を Conditional にし、中に Condition - user role (admin) と OTP Form を Required で置く。',
        '設定後は Bind flow をしなくても、自動的に browser フローとして使われる。',
        'Condition - user role は Disabled にして、OTP Form だけを実行する。'
      ], answer: 3,
      explain: [
        `1：× 標準フローは直接編集できない。Duplicate したコピーを編集する。`,
        `2：× Requirement は <b class="key">Conditional</b> にする。管理者だけに課すのが目的である。`,
        `3：○ Conditional の Sub-flow に、条件と OTP Form を Required で置く。`,
        `4：× <b class="key">Bind flow</b> で browser フローに設定して初めて適用される。`,
        `5：× 条件(Condition)は Required で置く。Disabled では条件として働かない。`
      ],
      tip: `「条件つきの箱(Conditional な Sub-flow)の中に、条件と実行内容を入れる」形で組む。` },
    { id: 'c12-mc-06', stem: `【正誤選択型】主な Execution に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Cookie は、ID とパスワードの入力画面を表示する。',
        'Identity Provider Redirector は、OTP コードの入力を求める。',
        'Username Password Form は、SSO Cookie があるとき画面なしで通す。',
        'WebAuthn Authenticator / Passkeys は、バックアップコードで認証する。',
        'Recovery Authentication Code Form は、バックアップコードで認証するステップである。'
      ], answer: 5,
      explain: [
        `1：× Cookie は SSO Cookie があればログイン済みとして通すステップである。`,
        `2：× Identity Provider Redirector は指定した外部 IdP へ自動で転送する。OTP の入力は OTP Form である。`,
        `3：× SSO Cookie があれば通すのは Cookie の Execution である。`,
        `4：× WebAuthn / Passkeys は指紋・セキュリティキー・パスキーである。バックアップコードは Recovery Authentication Code Form である。`,
        `5：○ <b class="key">Recovery Authentication Code Form</b> がバックアップコード用のステップである。`
      ],
      tip: `Execution は名前が役割を表す。Cookie=SSO 済み判定、Redirector=外部へ転送、Form=入力画面。` }
  ]
});
DATA.chapters.push({
  no: 13, title: `User Federation(LDAP / AD)`,
  lessons: [
    { id: 'c13-l01', title: `User Federation とは・用語・主な設定項目`, pages: [
      { id: 'c13-l01-p01', title: `User Federation とは・LDAP の用語`,
        html: `<p><b class="key">User Federation</b> は、会社にすでにある<b class="key">ユーザー名簿(LDAP / Active Directory)</b>を Keycloak につなぐ機能である。目的は、ユーザーを作り直さず、既存の ID/パスワードで Keycloak にログインさせることにある。</p><p>流れは、ログイン時に Keycloak が LDAP へ「このパスワードで合ってる?」と問い合わせる、というものである。</p><h4>用語</h4><table><tr><th>用語</th><th>意味</th></tr><tr><td><b class="key">LDAP</b></td><td>ユーザー情報を階層構造で持つディレクトリの標準プロトコル</td></tr><tr><td><b class="key">Active Directory (AD)</b></td><td>Microsoft の LDAP 互換ディレクトリ。Windows ドメインのユーザー名簿</td></tr><tr><td><b class="key">Bind DN / Bind credential</b></td><td>Keycloak が LDAP に接続するための管理用アカウント</td></tr><tr><td><b class="key">Users DN</b></td><td>ユーザーが入っている LDAP 上の場所(例: <code>ou=people,dc=example,dc=com</code>)</td></tr></table><span class="trap">Bind DN は「接続に使うアカウント」、Users DN は「ユーザーが置かれている場所」である。</span>`,
        oxIds: ['c13-ox-01', 'c13-ox-02'] },
      { id: 'c13-l01-p02', title: `接続・編集モード・同期の設定項目`,
        html: `<h4>接続まわり</h4><ul><li><b class="key">Vendor</b>: Active Directory / Red Hat DS など(属性名の既定値が変わる)</li><li><b class="key">Connection URL</b>: <code>ldap://ldap.example.com:389</code> / 暗号化なら <code>ldaps://...:636</code></li></ul><h4>Edit mode(Keycloak から LDAP を変更してよいか)</h4><table><tr><th>モード</th><th>動き</th></tr><tr><td><b class="key">READ_ONLY</b></td><td>読み取りのみ(パスワード変更も不可)</td></tr><tr><td><b class="key">WRITABLE</b></td><td>Keycloak での変更を LDAP に書き戻す</td></tr><tr><td><b class="key">UNSYNCED</b></td><td>変更は Keycloak 内だけに保存し、LDAP に反映しない</td></tr></table><h4>Import Users と同期</h4><ul><li><b class="key">Import Users</b>: ON なら LDAP ユーザーを Keycloak DB にコピーして使う。OFF は毎回 LDAP を参照する</li><li><b class="key">Periodic Full Sync</b>: 定期的に全ユーザーを同期</li><li><b class="key">Periodic Changed Users Sync</b>: 変更分だけを同期</li></ul>`,
        oxIds: ['c13-ox-03', 'c13-ox-04'] }
    ] },
    { id: 'c13-l02', title: `LDAP Mapper・Kerberos・Brokering との違い`, pages: [
      { id: 'c13-l02-p01', title: `LDAP Mapper(属性の対応づけ)`,
        html: `<p>LDAP の情報を Keycloak のユーザーとして使うには、属性の対応づけが要る。それを担うのが <b class="key">LDAP Mapper</b> である。</p><h4>主な Mapper</h4><table><tr><th>Mapper</th><th>対応づけ</th></tr><tr><td><code>user-attribute-ldap-mapper</code></td><td>LDAP の属性 → Keycloak ユーザー属性(例: <code>mail</code> → <code>email</code>)</td></tr><tr><td><code>group-ldap-mapper</code></td><td>LDAP グループ → Keycloak グループ</td></tr><tr><td><code>role-ldap-mapper</code></td><td>LDAP グループ → Keycloak ロール</td></tr></table><span class="trap">第4章の Protocol Mapper とは別物である。LDAP Mapper は「LDAP → Keycloak ユーザー」の変換を担う。</span>`,
        oxIds: ['c13-ox-05'] },
      { id: 'c13-l02-p02', title: `Kerberos・User Storage SPI・Brokering との違い`,
        html: `<h4>その他の機能</h4><ul><li><b class="key">Kerberos / SPNEGO</b>: Windows ドメインにログイン済みなら、パスワード入力なしでブラウザから自動ログインできる</li><li><b class="key">User Storage SPI</b>: 独自 DB など任意のユーザー保管先をつなぐ拡張(Java で実装)</li></ul><h4>User Federation と Identity Brokering の違い</h4><table><tr><th>機能</th><th>何をするか</th></tr><tr><td><b class="key">Federation</b></td><td><b class="key">名簿を Keycloak が直接読む</b>。ログイン画面は Keycloak</td></tr><tr><td><b class="key">Brokering</b></td><td><b class="key">ログインを外部 IdP に任せる</b>。画面も外部へ転送</td></tr></table><span class="trap">どちらも「外部と連携する」機能だが、ログイン画面がどこに出るかが違う。</span>`,
        oxIds: ['c13-ox-06', 'c13-ox-07'] }
    ] }
  ],
  ox: [
    { id: 'c13-ox-01', text: `User Federation では、ログイン時に Keycloak が LDAP にパスワードの確認を問い合わせるので、ユーザーを作り直さずに既存の ID/パスワードを使える。`, answer: true,
      explain: `Keycloak が LDAP に「このパスワードで合ってる?」と問い合わせるので、既存の名簿をそのまま使える。`, lesson: 'c13-l01' },
    { id: 'c13-ox-02', text: `Bind DN は、ユーザーが入っている LDAP 上の場所を表す。`, answer: false,
      explain: `誤り。<b class="key">Bind DN</b> は Keycloak が LDAP に接続するための管理用アカウントである。ユーザーの場所を表すのは <b class="key">Users DN</b> である。`, lesson: 'c13-l01' },
    { id: 'c13-ox-03', text: `Edit mode が READ_ONLY のとき、Keycloak での変更は LDAP に書き戻される。`, answer: false,
      explain: `誤り。READ_ONLY は読み取りのみで、パスワード変更もできない。書き戻すのは <b class="key">WRITABLE</b> である。`, lesson: 'c13-l01' },
    { id: 'c13-ox-04', text: `Import Users が OFF の場合、Keycloak は毎回 LDAP を参照してユーザー情報を取得する。`, answer: true,
      explain: `ON は LDAP ユーザーを Keycloak DB にコピーして使う設定で、<b class="key">OFF は毎回 LDAP を参照</b>する。`, lesson: 'c13-l01' },
    { id: 'c13-ox-05', text: `user-attribute-ldap-mapper は第4章の Protocol Mapper と同じもので、トークンの claim を作る。`, answer: false,
      explain: `誤り。LDAP Mapper は第4章の Protocol Mapper とは<b class="key">別物</b>で、「LDAP → Keycloak ユーザー」の変換を担う(例: <code>mail</code> → <code>email</code>)。`, lesson: 'c13-l02' },
    { id: 'c13-ox-06', text: `User Federation では Keycloak が名簿を直接読み、ログイン画面は Keycloak のものを使う。`, answer: true,
      explain: `Federation は<b class="key">名簿を Keycloak が直接読む</b>方式で、画面は Keycloak のままである。`, lesson: 'c13-l02' },
    { id: 'c13-ox-07', text: `Identity Brokering では、ログイン画面は Keycloak のまま、パスワードの確認だけを外部に問い合わせる。`, answer: false,
      explain: `誤り。Brokering は<b class="key">ログインを外部 IdP に任せる</b>方式で、画面も外部へ転送される。`, lesson: 'c13-l02' }
  ],
  mc: [
    { id: 'c13-mc-01', stem: `【組合せ型】User Federation の考え方に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `既存の LDAP / AD の名簿を Keycloak につなぎ、ユーザーを作り直さずに既存の ID/パスワードでログインさせられる。` },
        { label: 'B', text: `ログイン時、Keycloak が LDAP に「このパスワードで合っているか」を問い合わせる。` },
        { label: 'C', text: `Federation では、ログインを外部 IdP に任せ、画面も外部へ転送される。` },
        { label: 'D', text: `Bind DN は、ユーザーが入っている LDAP 上の場所を表す。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：○ 目的は、既存の名簿を使ってユーザーを作り直さずに済ませることである。`,
        `B：○ ログイン時に Keycloak が LDAP へ問い合わせる。`,
        `C：× ログインを外部へ任せ画面も転送するのは Brokering である。`,
        `D：× ユーザーの場所は Users DN、Bind DN は接続用の管理アカウントである。`
      ],
      tip: `Federation は「名簿を借りる」、Brokering は「ログインそのものを任せる」。` },
    { id: 'c13-mc-02', stem: `【組合せ型】Edit mode と Import Users に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `READ_ONLY では、Keycloak でのパスワード変更が LDAP に書き戻される。` },
        { label: 'B', text: `UNSYNCED は、Keycloak での変更を LDAP に書き戻す。` },
        { label: 'C', text: `WRITABLE は、Keycloak での変更を LDAP に書き戻す。` },
        { label: 'D', text: `Import Users が OFF なら、毎回 LDAP を参照する。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× READ_ONLY は読み取りのみで、パスワード変更もできない。`,
        `B：× UNSYNCED は変更を Keycloak 内だけに保存し、LDAP に反映しない。`,
        `C：○ <b class="key">WRITABLE</b> は書き戻す設定である。`,
        `D：○ ON は Keycloak DB にコピーして使い、OFF は毎回 LDAP を参照する。`
      ],
      tip: `Edit mode は「変更が LDAP に届くか」で整理する。届く=WRITABLE、届かず Keycloak 内だけ=UNSYNCED、変更不可=READ_ONLY。` },
    { id: 'c13-mc-03', stem: `【組合せ型】同期と LDAP Mapper に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Periodic Full Sync は、変更分だけを同期する。` },
        { label: 'B', text: `Periodic Changed Users Sync は、変更分だけを同期する。` },
        { label: 'C', text: `LDAP Mapper は第4章の Protocol Mapper とは別物で、LDAP → Keycloak ユーザーの変換を担う。` },
        { label: 'D', text: `user-attribute-ldap-mapper は、LDAP グループを Keycloak のロールに対応づける。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× Periodic Full Sync は定期的に<b class="key">全ユーザー</b>を同期する。`,
        `B：○ 変更分だけを同期するのは Periodic Changed Users Sync である。`,
        `C：○ LDAP Mapper と Protocol Mapper は別物である。`,
        `D：× LDAP グループをロールに対応づけるのは role-ldap-mapper である。user-attribute-ldap-mapper は属性の対応づけである。`
      ],
      tip: `Mapper 名は「何を何に対応づけるか」を表す。user-attribute=属性、group=グループ、role=ロール。` },
    { id: 'c13-mc-04', stem: `【正誤選択型】User Federation と Identity Brokering の違いに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Federation はログイン画面が外部に移り、Brokering は Keycloak の画面で ID/パスワードを受け取る。',
        'Federation では Keycloak が名簿を直接読み、ログイン画面は Keycloak のままである。',
        'Brokering では、Keycloak が LDAP にパスワードを問い合わせる。',
        'Federation と Brokering は、どちらもログイン画面を外部 IdP へ転送する。',
        'Brokering は、LDAP の属性を Keycloak のユーザー属性に変換する仕組みである。'
      ], answer: 2,
      explain: [
        `1：× 逆である。画面が外部に移るのは Brokering である。`,
        `2：○ Federation は<b class="key">名簿を直接読む</b>方式で、画面は Keycloak である。`,
        `3：× LDAP に問い合わせるのは Federation である。`,
        `4：× 画面を外部へ転送するのは Brokering だけである。`,
        `5：× LDAP 属性の変換は LDAP Mapper(Federation 側)の役割である。`
      ],
      tip: `ログイン画面がどこに出るか(Keycloak か外部か)で、Federation と Brokering を見分ける。` },
    { id: 'c13-mc-05', stem: `【正誤選択型】Kerberos・SPI などに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Kerberos / SPNEGO は、LDAP のユーザー属性を Keycloak のロールに対応づける。',
        'Kerberos / SPNEGO を使うと、Windows ドメインにログイン済みでも毎回パスワード入力が必要になる。',
        'Active Directory は、Java で実装する、独自 DB をユーザー保管先にする拡張である。',
        'Kerberos / SPNEGO を使うと、Windows ドメインにログイン済みならパスワード入力なしでブラウザから自動ログインできる。',
        'User Storage SPI は、Windows ドメインのユーザー名簿を指す名称である。'
      ], answer: 4,
      explain: [
        `1：× 属性・グループ・ロールの対応づけは LDAP Mapper の役割である。`,
        `2：× Windows ドメインにログイン済みなら、パスワード入力なしで自動ログインできる。`,
        `3：× Active Directory は Microsoft の LDAP 互換ディレクトリである。独自 DB をつなぐ拡張は User Storage SPI である。`,
        `4：○ <b class="key">Kerberos / SPNEGO</b> の説明として正しい。`,
        `5：× Windows ドメインのユーザー名簿は Active Directory である。User Storage SPI は独自のユーザー保管先をつなぐ拡張である。`
      ],
      tip: `Kerberos=ドメインログイン済みの自動ログイン、User Storage SPI=独自の保管先をつなぐ拡張、と役割で分ける。` },
    { id: 'c13-mc-06', stem: `【正誤選択型】LDAP 接続の設定項目に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Vendor は、LDAP への接続に使う管理用アカウントを指定する項目である。',
        'Connection URL は、ldaps:// のとき平文で、ldap:// のとき暗号化される。',
        'Users DN は、Keycloak が LDAP に接続するための管理用アカウントを表す。',
        'Bind DN / Bind credential は、Keycloak が LDAP に接続するための管理用アカウントである。',
        'Import Users が ON の場合、毎回 LDAP を参照し、Keycloak DB にはコピーしない。'
      ], answer: 4,
      explain: [
        `1：× Vendor は Active Directory / Red Hat DS などの種類で、属性名の既定値が変わる。管理用アカウントは Bind DN / Bind credential である。`,
        `2：× 暗号化されるのは <code>ldaps://</code>(例: ポート 636)である。`,
        `3：× Users DN はユーザーが入っている場所である。`,
        `4：○ <b class="key">Bind DN / Bind credential</b> は接続用の管理アカウントである。`,
        `5：× ON は Keycloak DB にコピーして使う。毎回 LDAP を参照するのは OFF である。`
      ],
      tip: `Bind=「接続するための身分」、Users DN=「ユーザーがいる場所」と、人と場所に分けて覚える。` }
  ]
});
DATA.chapters.push({
  no: 14, title: `セキュリティ・運用`,
  lessons: [
    { id: 'c14-l01', title: `本番で守ること(理由つき)`, pages: [
      { id: 'c14-l01-p01', title: `環境と realm に関する注意`,
        html: `<p>本番で守るべき項目は、どれも「やらないとどうなるか」という理由とセットで覚えると忘れにくい。</p><table><tr><th>守ること</th><th>理由</th></tr><tr><td><b class="key">HTTPS 必須</b></td><td>トークンやパスワードが盗聴されるため。<code>KC_HOSTNAME</code> や <code>KC_PROXY_HEADERS</code> で外向き URL を正しく伝える</td></tr><tr><td><b class="key"><code>start-dev</code> は開発専用</b></td><td>HTTP 許可・キャッシュ無効など安全でない既定のため。本番は <code>start</code> + <code>kc.sh build</code></td></tr><tr><td><b class="key"><code>master</code> realm を業務に使わない</b></td><td>master は全 realm の管理権限につながるため。業務ユーザーは別 realm に置く</td></tr><tr><td><b class="key">Valid redirect URIs でワイルドカードを避ける</b></td><td>攻撃者の URL に code が流れる(オープンリダイレクト)のを防ぐため</td></tr></table><span class="trap">開発で便利な設定(<code>start-dev</code> の既定、広いリダイレクト URI など)は、そのまま本番に持ち込まない。</span>`,
        oxIds: ['c14-ox-01', 'c14-ox-02'] },
      { id: 'c14-l01-p02', title: `フローとトークン・secret に関する注意`,
        html: `<table><tr><th>守ること</th><th>理由</th></tr><tr><td><b class="key">Implicit / Password Grant は OFF</b></td><td>トークン露出、ID/PW をアプリが扱う危険があるため</td></tr><tr><td><b class="key">SPA は Public + PKCE (S256)</b>、可能なら <b class="key">BFF</b> 化</td><td>ブラウザには secret を隠せないため。BFF ならトークンをブラウザに出さずに済む</td></tr><tr><td><b class="key">Access Token を短命に</b> + Refresh Token Rotation</td><td>盗まれても使える時間を短くするため</td></tr><tr><td><b class="key">secret は Git に入れない</b></td><td>シークレット管理サービスや環境変数で渡す</td></tr></table><h4>読み解き方</h4><ul><li>「ブラウザに secret を置けない」ので、SPA は Confidential にせず Public + PKCE にする</li><li>トークンを守る方法は 2 つ: 露出させない(BFF)、露出しても被害を小さくする(短命・Rotation)</li></ul><span class="trap">SPA を Confidential にしても、ブラウザ内に secret を隠せない。対策は PKCE と BFF である。</span>`,
        oxIds: ['c14-ox-03', 'c14-ox-04'] }
    ] },
    { id: 'c14-l02', title: `鍵管理・監視・構成・設定優先順位・テーマ/SPI`, pages: [
      { id: 'c14-l02-p01', title: `鍵管理: Providers・Priority・Active/Passive`,
        html: `<p>鍵は Realm settings → Keys で管理する。<b class="key">Keys list</b> には、現在の署名鍵の一覧(<code>kid</code>、有効期限、アルゴリズム)が出る。</p><h4>Providers(鍵の種類)</h4><table><tr><th>Provider</th><th>用途</th></tr><tr><td><code>rsa-generated</code></td><td>Access/ID Token の<b class="key">署名用</b> RSA 鍵(自動生成)</td></tr><tr><td><code>rsa-enc-generated</code></td><td><b class="key">暗号化用</b> RSA 鍵</td></tr><tr><td><code>hmac-generated-hs512</code></td><td>Refresh Token 等の署名用(共通鍵)</td></tr><tr><td><code>aes-generated</code></td><td>内部用の暗号化鍵</td></tr></table><h4>Priority と状態</h4><ul><li><b class="key">Priority</b>: 同じ種類の鍵が複数あるとき、<b class="key">数字が大きい</b>鍵で署名する</li><li><b class="key">Active</b> = 署名にも検証にも使う / <b class="key">Passive</b> = <b class="key">検証だけ</b>に使う / <b class="key">Disabled</b> = 使わない</li></ul>`,
        oxIds: ['c14-ox-05', 'c14-ox-06'] },
      { id: 'c14-l02-p02', title: `鍵のローテーション手順`,
        html: `<p>鍵を入れ替えるときに大事なのは、旧鍵で署名済みのトークンを検証できなくならないようにすることである。</p><h4>手順</h4><ol><li>新しい鍵を作り、<b class="key">Priority を高く</b>する(以降の署名は新鍵)</li><li>旧鍵を <b class="key">Passive</b> にする(旧鍵で署名済みのトークンはまだ検証できる)</li><li>トークンが全部失効する時間を待って、旧鍵を<b class="key">削除</b>する</li></ol><h4>なぜ Passive を挟むのか</h4><p>新鍵に切り替えた直後でも、世の中には旧鍵で署名したトークンがまだ残っている。旧鍵を Passive(検証だけ)にしておけば、それらを検証できる。すぐ削除するとそれらが検証できなくなる。</p><h4>API 側の対応</h4><p>API は JWKS を<b class="key">定期的に再取得</b>し、<code>kid</code> で鍵を選ぶこと。これにより、ローテーション後に新しい <code>kid</code> が現れても追従できる。</p><span class="trap">旧鍵を Passive にしないまま削除すると、まだ有効なはずのトークンが検証できなくなる。</span>`,
        oxIds: ['c14-ox-07', 'c14-ox-08'] },
      { id: 'c14-l02-p03', title: `監視・ログ、構成・高可用`,
        html: `<h4>監視・ログ</h4><ul><li><b class="key">Events</b>: <b class="key">User events</b> はログイン成功・失敗、ログアウト、トークン更新などの記録。<b class="key">Admin events</b> は管理操作(ユーザー作成・設定変更)の記録。Realm settings → Events で有効化し、保存期間も設定できる</li><li><b class="key">Metrics</b>: <code>KC_METRICS_ENABLED=true</code> で <code>/metrics</code>(Prometheus 形式)</li><li><b class="key">Health</b>: <code>KC_HEALTH_ENABLED=true</code> で <code>/health</code>(稼働確認。k8s の probe 用)</li></ul><h4>構成・高可用</h4><ul><li><b class="key">外部 DB</b>(PostgreSQL 推奨): 本番では内蔵 DB を使わない</li><li><b class="key">Infinispan</b>: Keycloak が使う分散キャッシュ。複数台でセッションを共有する</li><li><b class="key">Keycloak Operator</b>: Kubernetes にデプロイ・管理するための公式 Operator</li><li>リバースプロキシ配下では <code>KC_PROXY_HEADERS=xforwarded</code> 等でヘッダを信頼させる</li></ul><span class="trap">User events(利用者の行動)と Admin events(管理者の操作)を取り違えない。</span>`,
        oxIds: ['c14-ox-09', 'c14-ox-10'] },
      { id: 'c14-l02-p04', title: `設定の優先順位・テーマ・SPI`,
        html: `<h4>設定方法の優先順位</h4><p>優先順位は <b class="key">コマンドライン引数 &gt; 環境変数(<code>KC_...</code>) &gt; <code>conf/keycloak.conf</code></b> の順である。また、<code>kc.sh build</code> で変わる設定(DB 種類など)と、起動時に変えられる設定(ホスト名など)がある。</p><h4>Theme</h4><p>ログイン画面・アカウント画面・管理画面・メールの見た目を差し替える。FreeMarker テンプレート + CSS で作り、React で作るなら Keycloakify がある。</p><h4>SPI (Service Provider Interface)</h4><p><b class="key">Java で機能を追加する拡張口</b>である。</p><table><tr><th>SPI の例</th><th>できること</th></tr><tr><td>Authenticator</td><td>独自の認証手順</td></tr><tr><td>Event Listener</td><td>イベントを外部へ通知</td></tr><tr><td>Protocol Mapper</td><td>独自 claim</td></tr><tr><td>User Storage</td><td>独自ユーザー保管先</td></tr></table><p>JAR を <code>providers/</code> に置いて <code>kc.sh build</code> する。</p>`,
        oxIds: ['c14-ox-11'] }
    ] }
  ],
  ox: [
    { id: 'c14-ox-01', text: `start-dev は HTTP 許可・キャッシュ無効など安全でない既定を持つため、開発専用であり、本番は start と kc.sh build を使う。`, answer: true,
      explain: `<code>start-dev</code> は開発専用の既定値(HTTP 許可、キャッシュ無効)で動くため、本番では <code>start</code> + <code>kc.sh build</code> を使う。`, lesson: 'c14-l01' },
    { id: 'c14-ox-02', text: `master realm は全 realm の管理権限につながるので、業務ユーザーもまとめて master に置いて管理するのがよい。`, answer: false,
      explain: `誤り。master は全 realm の管理権限につながるからこそ、<b class="key">業務に使わず</b>、業務ユーザーは別 realm に置く。`, lesson: 'c14-l01' },
    { id: 'c14-ox-03', text: `SPA を Confidential client にすれば、ブラウザ内でも secret を安全に隠せる。`, answer: false,
      explain: `誤り。ブラウザには secret を隠せない。だから SPA は <b class="key">Public + PKCE (S256)</b> とし、可能なら BFF 化する。`, lesson: 'c14-l01' },
    { id: 'c14-ox-04', text: `Access Token を短命にするのは、盗まれても使える時間を短くするためである。`, answer: true,
      explain: `トークンは盗まれる可能性があるので、<b class="key">有効期間を短く</b>して被害を小さくする。Refresh Token Rotation と併用する。`, lesson: 'c14-l01' },
    { id: 'c14-ox-05', text: `Passive の鍵は署名には使われず、検証だけに使われる。`, answer: true,
      explain: `<b class="key">Passive</b> は検証だけ。Active は署名にも検証にも使い、Disabled は使わない。`, lesson: 'c14-l02' },
    { id: 'c14-ox-06', text: `同じ種類の鍵が複数あるとき、署名には Priority の数字が小さい鍵が使われる。`, answer: false,
      explain: `誤り。署名には <b class="key">数字が大きい</b> Priority の鍵が使われる。`, lesson: 'c14-l02' },
    { id: 'c14-ox-07', text: `鍵のローテーションでは、新しい鍵を作ったらすぐ旧鍵を削除するのが安全である。`, answer: false,
      explain: `誤り。旧鍵は <b class="key">Passive</b> にして、旧鍵で署名済みのトークンが失効するまで待ってから削除する。すぐ削除すると、まだ有効なトークンを検証できなくなる。`, lesson: 'c14-l02' },
    { id: 'c14-ox-08', text: `API は JWKS を定期的に再取得し、kid で鍵を選ぶようにしておくと、鍵ローテーション後にも追従できる。`, answer: true,
      explain: `<code>kid</code> で鍵を選ぶので、新しい鍵が追加されても JWKS を<b class="key">再取得</b>すれば対応できる。`, lesson: 'c14-l02' },
    { id: 'c14-ox-09', text: `Admin events は、ログイン成功・失敗やトークン更新を記録するためのものである。`, answer: false,
      explain: `誤り。ログイン成功・失敗やトークン更新を記録するのは <b class="key">User events</b> である。Admin events は管理操作(ユーザー作成・設定変更)の記録である。`, lesson: 'c14-l02' },
    { id: 'c14-ox-10', text: `Keycloak の複数台構成では、分散キャッシュの Infinispan を使ってセッションを共有する。`, answer: true,
      explain: `<b class="key">Infinispan</b> は Keycloak が使う分散キャッシュで、複数台でセッションを共有する。`, lesson: 'c14-l02' },
    { id: 'c14-ox-11', text: `同じ設定をコマンドライン引数と環境変数の両方で指定した場合は、コマンドライン引数が優先される。`, answer: true,
      explain: `優先順位は<b class="key">コマンドライン引数 &gt; 環境変数 &gt; conf/keycloak.conf</b> の順である。`, lesson: 'c14-l02' }
  ],
  mc: [
    { id: 'c14-mc-01', stem: `【組合せ型】本番運用で守ることとその理由に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `start-dev は本番でも使えるが、キャッシュ無効のため少し遅くなるだけである。` },
        { label: 'B', text: `start-dev は HTTP 許可・キャッシュ無効など安全でない既定のため開発専用で、本番は start と kc.sh build を使う。` },
        { label: 'C', text: `Valid redirect URIs にワイルドカードを使っても、攻撃者の URL に code が流れることはないので問題ない。` },
        { label: 'D', text: `SPA は Public client + PKCE (S256) にし、可能なら BFF 化すると、ブラウザにトークンを出さずに済む。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× 遅くなるだけではない。HTTP 許可など安全でない既定のため、開発専用である。`,
        `B：○ 本番は <code>start</code> + <code>kc.sh build</code> を使う。`,
        `C：× ワイルドカードは、攻撃者の URL に code が流れる(オープンリダイレクト)原因になる。`,
        `D：○ BFF ならトークンをブラウザに出さずに済む。`
      ],
      tip: `各項目は「やらないと何が起きるか」とセットで覚える。理由が分かれば、設定の意味も判断できる。` },
    { id: 'c14-mc-02', stem: `【組合せ型】鍵管理に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Priority は、同じ種類の鍵が複数あるときに、数字が大きい鍵で署名することを表す。` },
        { label: 'B', text: `Passive の鍵は検証だけに使われるため、旧鍵で署名済みのトークンの検証を続けられる。` },
        { label: 'C', text: `Active の鍵は検証にだけ使われ、署名には使われない。` },
        { label: 'D', text: `rsa-generated は、Refresh Token 等の署名に使う共通鍵である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：○ 数字が大きい鍵が署名に使われる。`,
        `B：○ Passive は検証専用なので、旧鍵で署名済みのトークンも検証できる。`,
        `C：× Active は署名にも検証にも使う。`,
        `D：× Access/ID Token の署名用の RSA 鍵である。Refresh Token 等の共通鍵は hmac-generated-hs512 である。`
      ],
      tip: `Active=署名+検証、Passive=検証だけ、Disabled=使わない。Passive は「引退前の旧鍵」の置き場である。` },
    { id: 'c14-mc-03', stem: `【組合せ型】鍵のローテーションと API 側の対応に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `新しい鍵を作って Priority を高くすると、以降の署名は新しい鍵で行われる。` },
        { label: 'B', text: `旧鍵は、新鍵を作った時点ですぐ削除してよい。` },
        { label: 'C', text: `API 側は JWKS を定期的に再取得し、kid で鍵を選ぶ。` },
        { label: 'D', text: `旧鍵を Passive にすると、旧鍵で署名済みのトークンは検証できなくなる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ Priority が高い鍵が署名に使われる。`,
        `B：× 旧鍵で署名済みのトークンが失効するまで待ってから削除する。`,
        `C：○ kid で鍵を選べば、新旧どちらの鍵のトークンも検証できる。`,
        `D：× Passive は検証だけに使うので、旧鍵のトークンは検証できる。`
      ],
      tip: `ローテーションは「新鍵を先頭に、旧鍵は検証専用で残し、トークンが尽きたら削除」の 3 段階で考える。` },
    { id: 'c14-mc-04', stem: `【正誤選択型】監視・ログに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Admin events は、ログイン成功や失敗、トークン更新などの記録である。',
        'User events は、ユーザー作成や設定変更などの管理操作の記録である。',
        'Metrics は KC_HEALTH_ENABLED=true で有効になり、/health で公開される。',
        'Health は Prometheus 形式で出力され、/metrics に公開される。',
        'Metrics は KC_METRICS_ENABLED=true で有効にでき、/metrics に Prometheus 形式で公開される。'
      ], answer: 5,
      explain: [
        `1：× ログイン成功・失敗などは User events の記録である。`,
        `2：× 管理操作の記録は Admin events である。`,
        `3：× Metrics は <code>KC_METRICS_ENABLED=true</code>、<code>/metrics</code> である。<code>/health</code> は Health である。`,
        `4：× Health は稼働確認用で <code>/health</code>、Prometheus 形式は Metrics である。`,
        `5：○ Metrics の説明として正しい。`
      ],
      tip: `Metrics=数値の監視(Prometheus)、Health=生きているかの確認(k8s の probe)。` },
    { id: 'c14-mc-05', stem: `【正誤選択型】構成・高可用と設定方法に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        '本番では、内蔵 DB のまま運用するのがよい。',
        'Infinispan は Keycloak が使う外部の RDB で、PostgreSQL が推奨される。',
        '複数台構成では、分散キャッシュの Infinispan がセッションを共有する。',
        '設定の優先順位は、conf/keycloak.conf、環境変数、コマンドライン引数の順に高い。',
        'kc.sh build が必要になる設定は存在せず、すべて起動時に変更できる。'
      ], answer: 3,
      explain: [
        `1：× 本番では内蔵 DB を使わず、外部 DB(PostgreSQL 推奨)を使う。`,
        `2：× Infinispan は分散キャッシュである。推奨される外部 DB は PostgreSQL である。`,
        `3：○ 複数台でセッションを共有するために Infinispan を使う。`,
        `4：× 優先順位は、コマンドライン引数、環境変数、conf/keycloak.conf の順に高い。`,
        `5：× <code>kc.sh build</code> で変わる設定(DB 種類など)と、起動時に変えられる設定(ホスト名など)がある。`
      ],
      tip: `複数台で動かすと、セッションの共有(Infinispan)とデータの共有(外部 DB)が必要になる、と因果で覚える。` },
    { id: 'c14-mc-06', stem: `【正誤選択型】テーマと SPI に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'SPI は Java で機能を追加する拡張口で、JAR を providers/ に置いて kc.sh build する。',
        'Theme で差し替えられるのはログイン画面だけで、アカウント画面やメールは変えられない。',
        'Event Listener は、独自の claim を作るための SPI である。',
        'User Storage SPI は、独自の認証手順を追加するための拡張口である。',
        'SPI の JAR は realm の import 時に自動で読み込まれ、kc.sh build は不要である。'
      ], answer: 1,
      explain: [
        `1：○ JAR を <code>providers/</code> に置いて <code>kc.sh build</code> する。`,
        `2：× Theme はログイン画面・アカウント画面・管理画面・メールの見た目を差し替える。`,
        `3：× 独自 claim は Protocol Mapper の SPI である。Event Listener はイベントを外部へ通知する。`,
        `4：× 独自の認証手順は Authenticator である。User Storage は独自ユーザー保管先をつなぐ。`,
        `5：× JAR を置いたあと <code>kc.sh build</code> が必要である。`
      ],
      tip: `SPI は「何を差し込むか」で名前が決まる。認証手順=Authenticator、通知=Event Listener、claim=Protocol Mapper、保管先=User Storage。` }
  ]
});
DATA.chapters.push({
  no: 15, title: `Admin REST API`,
  lessons: [
    { id: 'c15-l01', title: `概要・トークンの取り方・必要ロール`, pages: [
      { id: 'c15-l01-p01', title: `Admin REST API とは`,
        html: `<p><b class="key">Admin REST API</b> は、管理画面でできる操作(ユーザー作成・クライアント設定など)を <b class="key">HTTP API で自動化</b>するものである。</p><h4>基本情報</h4><table><tr><th>項目</th><th>内容</th></tr><tr><td>ベース URL</td><td><code>http://localhost:8080/admin/realms/{realm}/...</code></td></tr><tr><td>認証</td><td>管理権限を持つユーザー/クライアントの <b class="key">Access Token</b> を <code>Authorization: Bearer</code> で付ける</td></tr><tr><td>用途</td><td>ユーザー一括登録、環境構築の自動化、アプリからのユーザー管理</td></tr></table><p>つまり、管理画面を人が操作する代わりに、プログラムが Access Token を付けて同じ操作を呼び出す、という位置づけである。</p><span class="trap">ベース URL は <code>/admin/realms/{realm}/...</code> である。ログインやトークン取得に使う <code>/realms/{realm}/protocol/openid-connect/...</code> とは別の入口である。</span>`,
        oxIds: ['c15-ox-01', 'c15-ox-02'] },
      { id: 'c15-l01-p02', title: `管理用トークンの取り方`,
        html: `<p>Admin REST API を呼ぶには、まず管理権限を持つ Access Token が要る。試すときと本番で、取り方が違う。</p><h4>試すとき: 管理者ユーザーで取る</h4><p><b class="key">admin-cli</b> クライアントと Password Grant を使う。</p><pre>TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \\
  -d client_id=admin-cli -d grant_type=password \\
  -d username=admin -d password=admin | jq -r .access_token)</pre><ul><li><code>admin-cli</code> は Keycloak に最初から入っている管理用の <b class="key">Public クライアント</b>である</li><li>取得先は <b class="key">master realm</b>(管理者が master にいるため)</li></ul><h4>本番: 専用クライアントで取る</h4><p>Client auth ON + Service accounts を有効にした<b class="key">専用クライアントの Client Credentials</b> を使う。その Service account には、<code>realm-management</code> の<b class="key">必要最小限のロール</b>だけを付ける。</p><span class="trap">admin-cli + Password Grant は試すとき用である。本番では専用クライアントと Client Credentials を使う。</span>`,
        oxIds: ['c15-ox-03', 'c15-ox-04'] },
      { id: 'c15-l01-p03', title: `必要なロール(realm-management)`,
        html: `<p>Admin REST API で何ができるかは、トークンの主体(ユーザーまたは Service account)に付いたロールで決まる。必要なロールは <b class="key"><code>realm-management</code> クライアントのロール</b>として用意されている。</p><h4>主なロール</h4><table><tr><th>ロール</th><th>できること</th></tr><tr><td><code>view-users</code> / <code>manage-users</code></td><td>ユーザーの参照 / 作成・変更</td></tr><tr><td><code>view-clients</code> / <code>manage-clients</code></td><td>クライアントの参照 / 作成・変更</td></tr><tr><td><code>view-realm</code> / <code>manage-realm</code></td><td>realm 設定の参照 / 変更</td></tr><tr><td><code>query-users</code>, <code>query-groups</code></td><td>検索</td></tr><tr><td><code>realm-admin</code></td><td>全部(<b class="key">強すぎるので避ける</b>)</td></tr></table><h4>選び方</h4><p><code>view-*</code> は参照、<code>manage-*</code> は作成・変更である。やりたい操作に必要な分だけを付ける。</p><span class="trap">手軽だからと <code>realm-admin</code> を付けない。権限が必要最小限になるよう、個別のロールを選ぶ。</span>`,
        oxIds: ['c15-ox-05', 'c15-ox-06'] }
    ] },
    { id: 'c15-l02', title: `主な API・自動化手段`, pages: [
      { id: 'c15-l02-p01', title: `主な API の使い方`,
        html: `<h4>主な API</h4><table><tr><th>操作</th><th>呼び方</th></tr><tr><td>ユーザー検索</td><td><code>GET /admin/realms/myrealm/users?username=taro</code></td></tr><tr><td>ユーザー作成</td><td><code>POST /admin/realms/myrealm/users</code>(body: JSON)</td></tr><tr><td>クライアント検索</td><td><code>GET /admin/realms/myrealm/clients?clientId=frontend-spa</code></td></tr><tr><td>secret 取得</td><td><code>GET /admin/realms/myrealm/clients/{uuid}/client-secret</code></td></tr><tr><td>ロール付与</td><td><code>POST /admin/realms/myrealm/users/{userId}/role-mappings/realm</code></td></tr></table><h4>ユーザー作成の body 例</h4><pre>{ "username": "hanako", "email": "hanako@example.com", "enabled": true,
  "credentials": [{ "type": "password", "value": "pass1234", "temporary": false }] }</pre><h4>呼び出し例</h4><pre>curl -H "Authorization: Bearer $TOKEN" \\
  http://localhost:8080/admin/realms/myrealm/users</pre><h4>Client UUID に注意</h4><p>クライアント検索の返りの <code>id</code> が <b class="key">Client UUID</b> で、以降の API(secret 取得など)のパスにはこれを使う。</p><span class="trap"><code>clientId</code>(例: <code>frontend-spa</code>)と Client UUID(<code>id</code>)は別物である。パスに入れるのは UUID である。</span>`,
        oxIds: ['c15-ox-07', 'c15-ox-08'] },
      { id: 'c15-l02-p02', title: `そのほかの自動化手段`,
        html: `<p>HTTP で API を直接呼ぶ以外にも、自動化の手段がある。</p><table><tr><th>手段</th><th>内容</th></tr><tr><td><b class="key">kcadm.sh</b></td><td>Keycloak 同梱の CLI。API を呼ぶラッパー</td></tr><tr><td><b class="key">Terraform provider</b></td><td>realm / client / role をコードで管理する(宣言的)</td></tr><tr><td><b class="key">Import / Export</b></td><td><code>kc.sh export --realm myrealm</code> で設定を JSON に書き出し、<code>kc.sh import</code> や <code>--import-realm</code> で復元</td></tr><tr><td><b class="key">Account REST API</b></td><td>ユーザー本人が自分の情報を操作する API(<b class="key">別物</b>)</td></tr></table><span class="trap">Account REST API は本人が自分の情報を操作するための別の API であり、管理者向けの Admin REST API ではない。</span>`,
        oxIds: ['c15-ox-09'] }
    ] }
  ],
  ox: [
    { id: 'c15-ox-01', text: `Admin REST API を呼ぶときは、管理権限を持つ Access Token を Authorization: Bearer で付ける。`, answer: true,
      explain: `認証は、管理権限を持つユーザー/クライアントの <b class="key">Access Token</b> を <code>Authorization: Bearer</code> で付ける方法である。`, lesson: 'c15-l01' },
    { id: 'c15-ox-02', text: `Admin REST API のベース URL は、/realms/{realm}/protocol/openid-connect/ 配下である。`, answer: false,
      explain: `誤り。ベース URL は <b class="key"><code>/admin/realms/{realm}/...</code></b> である。<code>/realms/{realm}/protocol/openid-connect/...</code> はトークン取得などの入口である。`, lesson: 'c15-l01' },
    { id: 'c15-ox-03', text: `admin-cli は Confidential クライアントなので、トークンを取るときに client secret が必要である。`, answer: false,
      explain: `誤り。<b class="key">admin-cli</b> は Keycloak に最初から入っている管理用の <b class="key">Public クライアント</b>である。`, lesson: 'c15-l01' },
    { id: 'c15-ox-04', text: `admin-cli で管理者のトークンを取るときの取得先は、操作対象の myrealm である。`, answer: false,
      explain: `誤り。取得先は <b class="key">master realm</b> である。管理者が master にいるためである。`, lesson: 'c15-l01' },
    { id: 'c15-ox-05', text: `本番では、手軽なので Service account に realm-admin を付けるのがよい。`, answer: false,
      explain: `誤り。<code>realm-admin</code> は全部の権限を持ち<b class="key">強すぎる</b>ので避ける。必要最小限のロールだけを付ける。`, lesson: 'c15-l01' },
    { id: 'c15-ox-06', text: `ユーザーを参照するには view-users、作成・変更するには manage-users のロールが使われる。`, answer: true,
      explain: `<code>view-*</code> は参照、<code>manage-*</code> は作成・変更である。ユーザーなら <code>view-users</code> / <code>manage-users</code> である。`, lesson: 'c15-l01' },
    { id: 'c15-ox-07', text: `クライアント検索の返りに含まれる id は Client UUID で、secret 取得など以降の API のパスに使う。`, answer: true,
      explain: `返りの <code>id</code> が <b class="key">Client UUID</b> で、<code>/clients/{uuid}/client-secret</code> のようなパスに使う。`, lesson: 'c15-l02' },
    { id: 'c15-ox-08', text: `client-secret を取得する API のパスには、clientId(例: frontend-spa)をそのまま入れる。`, answer: false,
      explain: `誤り。パスには clientId ではなく <b class="key">Client UUID</b>(クライアント検索の返りの <code>id</code>)を入れる。`, lesson: 'c15-l02' },
    { id: 'c15-ox-09', text: `kc.sh export --realm で設定を JSON に書き出し、kc.sh import や --import-realm で復元できる。`, answer: true,
      explain: `<b class="key">Import / Export</b> は、realm の設定を JSON で書き出し、あとから復元できる自動化手段である。`, lesson: 'c15-l02' }
  ],
  mc: [
    { id: 'c15-mc-01', stem: `【組合せ型】Admin REST API の基本に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Admin REST API は、ユーザー本人が自分の情報を操作するための API である。` },
        { label: 'B', text: `Admin REST API は、管理画面でできる操作を HTTP API で自動化するもので、Access Token を Authorization: Bearer で付けて呼ぶ。` },
        { label: 'C', text: `ベース URL は /admin/realms/{realm}/... で、ユーザー一括登録や環境構築の自動化に使える。` },
        { label: 'D', text: `Admin REST API は認証なしで、localhost からだけ呼べる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× それは Account REST API である。Admin REST API は管理操作の自動化用である。`,
        `B：○ 管理権限を持つ Access Token を Bearer で付けて呼ぶ。`,
        `C：○ ベース URL と用途の説明として正しい。`,
        `D：× 管理権限を持つ Access Token が必要である。`
      ],
      tip: `Admin REST API は「管理画面の代わりをプログラムにやらせる」入口で、管理権限つきのトークンが通行証になる。` },
    { id: 'c15-mc-02', stem: `【組合せ型】管理用トークンの取り方に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `admin-cli は Confidential クライアントで、secret を付けて使う。` },
        { label: 'B', text: `試すときは admin-cli と Password Grant を使い、取得先は管理者が属する master realm である。` },
        { label: 'C', text: `本番でも、admin-cli と Password Grant を使うのが推奨される。` },
        { label: 'D', text: `本番では、Client auth ON と Service accounts を有効にした専用クライアントで Client Credentials を使い、必要最小限のロールだけを付ける。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× admin-cli は Public クライアントである。`,
        `B：○ 試すとき用の取り方で、取得先は master realm である。`,
        `C：× 本番では専用クライアントの Client Credentials を使う。`,
        `D：○ Service account には <code>realm-management</code> の必要最小限のロールだけを付ける。`
      ],
      tip: `「人が試す(Password Grant)」と「プログラムが動かす(Client Credentials)」の違いで、取り方を分ける。` },
    { id: 'c15-mc-03', stem: `【組合せ型】Admin REST API に必要なロールに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `realm-admin は全部の操作ができて扱いやすいので、最初に付けるのがよい。` },
        { label: 'B', text: `view-users はユーザーの作成・変更ができ、manage-users は参照だけができる。` },
        { label: 'C', text: `view-clients はクライアントの参照、manage-clients は作成・変更のためのロールである。` },
        { label: 'D', text: `必要なロールは realm-management クライアントのロールとして用意されており、realm-admin は強すぎるので避ける。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× <code>realm-admin</code> は強すぎるので避ける。必要最小限のロールを付ける。`,
        `B：× 逆である。view は参照、manage は作成・変更である。`,
        `C：○ <code>view-*</code> は参照、<code>manage-*</code> は作成・変更である。`,
        `D：○ <code>realm-management</code> クライアントのロールで、最小権限が原則である。`
      ],
      tip: `view=見るだけ、manage=触れる、realm-admin=何でもできる(だから避ける)。最小権限で考える。` },
    { id: 'c15-mc-04', stem: `【正誤選択型】主な API の使い方に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'クライアント検索の返りの id は Client UUID で、secret 取得などその後の API のパスに使う。',
        'clientId(例: frontend-spa)をそのままパスに入れて client-secret を取得する。',
        'ユーザー作成は GET で行い、ユーザー情報は URL に付ける。',
        'ユーザー検索は POST /admin/realms/myrealm/users?username=taro で行う。',
        'ユーザー作成の body には、credentials を含めることはできない。'
      ], answer: 1,
      explain: [
        `1：○ <b class="key">Client UUID</b> を以降のパスに使う。`,
        `2：× パスに入れるのは clientId ではなく Client UUID である。`,
        `3：× ユーザー作成は <code>POST</code> で、body に JSON を付ける。`,
        `4：× ユーザー検索は <code>GET</code> である。`,
        `5：× body 例では <code>credentials</code> でパスワードも設定している。`
      ],
      tip: `Admin API のパスで使う識別子は UUID(内部 id)。見慣れた clientId や username とは別だと意識する。` },
    { id: 'c15-mc-05', stem: `【正誤選択型】自動化手段に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'kcadm.sh は、Keycloak とは別に配布される Web 管理画面である。',
        'kcadm.sh は Keycloak に同梱された CLI で、API を呼ぶラッパーである。',
        'Terraform provider は、realm / client / role を手順書(コマンド列)で管理する手続き的な方法である。',
        'kc.sh export は、ユーザーのパスワードだけを書き出すコマンドである。',
        'Account REST API は、管理者が全ユーザーを管理する API で、Admin REST API と同じものである。'
      ], answer: 2,
      explain: [
        `1：× kcadm.sh は Keycloak 同梱の CLI であり、Web 管理画面ではない。`,
        `2：○ API を呼ぶラッパーである。`,
        `3：× Terraform provider は<b class="key">宣言的</b>に、コードで realm / client / role を管理する。`,
        `4：× <code>kc.sh export --realm</code> は realm の設定を JSON に書き出す。`,
        `5：× Account REST API は、ユーザー本人が自分の情報を操作する別物の API である。`
      ],
      tip: `自動化の手段は「API を直接呼ぶ・CLI で呼ぶ・コードで宣言する・JSON で丸ごと移す」の 4 通りで整理する。` },
    { id: 'c15-mc-06', stem: `【正誤選択型】Admin REST API の権限と認証に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'admin-cli は Confidential クライアントなので、トークン取得に secret が必要である。',
        '本番でも、管理者ユーザーと admin-cli の Password Grant を使うのが基本である。',
        'Admin REST API で何ができるかは、トークンの主体に付いた realm-management のロールで決まる。',
        'realm-admin を付ければ必要最小限の権限になるので、Service account にはこれを付ける。',
        'Admin REST API のベース URL は、/realms/{realm}/protocol/openid-connect/ である。'
      ], answer: 3,
      explain: [
        `1：× admin-cli は <b class="key">Public クライアント</b>である。`,
        `2：× 本番は専用クライアントの Client Credentials を使う。`,
        `3：○ ユーザーまたは Service account に付いた <code>realm-management</code> のロールで操作範囲が決まる。`,
        `4：× realm-admin は全部の権限で強すぎる。必要最小限のロールを付ける。`,
        `5：× ベース URL は <code>/admin/realms/{realm}/...</code> である。`
      ],
      tip: `トークンが通行証、realm-management のロールが「通れる扉」。扉は必要な分だけ開ける。` }
  ]
});
