// Keycloak 大全集 data part 1: 章 1〜4
DATA.chapters.push({
  no: 1, title: `全体像`,
  lessons: [
    { id: 'c01-l01', title: `Keycloak とは・登場人物`, pages: [
      { id: 'c01-l01-p01', title: `Keycloak とは何か`,
        html: `<h4>Keycloak の位置づけ</h4><p><b class="key">Keycloak</b> は OSS の <b class="key">IdP (Identity Provider)</b>、つまり認証認可サーバーである。SSO、OAuth 2.0、OpenID Connect (OIDC)、SAML 2.0 をサポートする。</p><h4>3つの規格の関係</h4><ul><li><b class="key">OAuth 2.0</b> = <b class="key">認可</b>の枠組み。アクセストークンを渡す</li><li><b class="key">OIDC</b> = OAuth 2.0 の上に<b class="key">認証</b> (ID トークン) を足したもの</li><li><b class="key">SAML</b> = XML ベースの古い SSO 規格。企業内システム連携で現役</li></ul><p>OAuth 2.0 が「アクセストークンを渡す」ところまでを受け持ち、その上に「誰がログインしたか」を伝える ID トークンを足したのが OIDC、という積み上げの関係になっている。</p><span class="trap">混同しやすい点: OAuth 2.0 は認可、OIDC が認証を担う。OIDC は OAuth 2.0 を置き換えるものではなく、その上に載るものである。</span>`,
        oxIds: ['c01-ox-01', 'c01-ox-02'] },
      { id: 'c01-l01-p02', title: `登場人物 (OAuth / OIDC の役割名)`,
        html: `<h4>4つの役割</h4><p>OAuth / OIDC の説明では、登場するものに次の役割名が付く。以降の章でも頻繁に出てくるので、Keycloak のどれに対応するかを押さえておく。</p><table><tr><th>役割名</th><th>実体</th></tr><tr><td><b class="key">Resource Owner</b></td><td>ユーザー</td></tr><tr><td><b class="key">Client</b></td><td>アプリ (Keycloak 上の "Client")</td></tr><tr><td><b class="key">Authorization Server</b></td><td>Keycloak</td></tr><tr><td><b class="key">Resource Server</b></td><td>API (トークンを検証する側)</td></tr></table><h4>読み方</h4><p>Keycloak は Authorization Server として、ユーザーの認証を行いトークンを発行する側に立つ。トークンを受け取って API を呼ぶのが Client、そのトークンを検証して応えるのが Resource Server である。</p><span class="trap">Keycloak の管理画面にも "Client" が出てくるが、これは役割名の Client (アプリ) の登録情報である。Keycloak 自身が Client になるわけではない。</span>`,
        oxIds: ['c01-ox-03'] }
    ] },
    { id: 'c01-l02', title: `Keycloak の中身 (Realm〜Session)`, pages: [
      { id: 'c01-l02-p01', title: `Realm と Client`,
        html: `<h4>Realm (レルム)</h4><ul><li>ユーザー・クライアント・設定をまとめる<b class="key">独立した管理単位</b> (テナント)</li><li>realm が違えば、ユーザーも設定も<b class="key">完全に別物</b>。同じ username でも別人扱い</li><li><code>master</code> realm は Keycloak 自体の管理者用。業務アプリのユーザーは入れない</li><li>例: 自社アプリ用に <code>myrealm</code> を作る。URL は <code>/realms/myrealm/...</code></li></ul><h4>Client (クライアント)</h4><ul><li>Keycloak に<b class="key">ログインを任せるアプリ / API の登録情報</b></li><li>1アプリ = 1 Client が基本。<code>client_id</code> で識別する</li><li>例: <code>frontend-spa</code> (画面)、<code>backend-api</code> (API)、<code>batch-job</code> (バッチ)</li><li>設定する内容: 許可するフロー、リダイレクト先 URL、認証方式 (secret の有無) など → 第5・6章</li></ul><span class="trap">URL の <code>/realms/myrealm/</code> の <code>myrealm</code> は realm の名前であり、Client の名前ではない。</span>`,
        oxIds: ['c01-ox-04', 'c01-ox-05'] },
      { id: 'c01-l02-p02', title: `User・Role・Group`,
        html: `<h4>3つの部品</h4><ul><li><b class="key">User (ユーザー)</b>: ログインする人。username / email / パスワード / 属性を持つ</li><li><b class="key">Role (ロール)</b>: 権限のラベル。例 <code>admin</code>, <code>read</code>。ユーザーやグループに付ける → 第11章</li><li><b class="key">Group (グループ)</b>: ユーザーの束。グループにロールを付けると<b class="key">メンバー全員に効く</b></li></ul><h4>なぜグループがあるのか</h4><p>ロールをユーザー1人ずつに付けると手間がかかる。グループを作ってロールを付けておけば、そのグループにユーザーを入れるだけで同じロールが効く。たとえばグループに <code>read</code> ロールを付ければ、メンバー全員が <code>read</code> の権限を持つ扱いになる。</p><span class="trap">ロールは「権限のラベル」、グループは「ユーザーの束」。役割が違うので取り違えない。</span>`,
        oxIds: ['c01-ox-06', 'c01-ox-07'] },
      { id: 'c01-l02-p03', title: `Client Scope・IdP・User Federation・Authentication Flow`,
        html: `<h4>残りの部品</h4><p>ここまでの部品に加えて、トークンの中身・ログイン元・ユーザー名簿・ログイン手順を扱う部品がある。</p><table><tr><th>部品</th><th>何か</th><th>詳細</th></tr><tr><td><b class="key">Client Scope</b></td><td>トークンに載せる情報のセット。<b class="key">Protocol Mapper</b> はその中の「claim を1つ作る部品」</td><td>第4章</td></tr><tr><td><b class="key">Identity Provider (IdP)</b></td><td><b class="key">Keycloak の外にある</b>ログイン元 (Google, GitHub, 他の Keycloak, 企業の SAML)。「Google でログイン」ができる</td><td>第9章</td></tr><tr><td><b class="key">User Federation</b></td><td><b class="key">既存のユーザー名簿</b> (LDAP / Active Directory) を Keycloak につなぐ</td><td>第13章</td></tr><tr><td><b class="key">Authentication Flow</b></td><td><b class="key">ログイン手順の定義</b> (パスワード → OTP など)</td><td>第12章</td></tr></table><span class="trap">IdP は「外にあるログイン元」、User Federation は「既存のユーザー名簿をつなぐ」もの。どちらも外部と連携するが、つなぐ対象が違う。</span>`,
        oxIds: ['c01-ox-08', 'c01-ox-09'] },
      { id: 'c01-l02-p04', title: `Session と SSO`,
        html: `<h4>Session (セッション)</h4><p><b class="key">Session</b> とは「ログイン中」という状態のことである。この状態を <b class="key">Keycloak が覚えている</b>ので、2つ目のアプリに移っても再度ログイン情報を入力しなくてよい。これが <b class="key">SSO (シングルサインオン)</b> である。</p><h4>流れのイメージ</h4><ol><li>アプリ A にアクセスし、Keycloak でログインする</li><li>Keycloak が「この人はログイン中」という Session を覚える</li><li>アプリ B にアクセスすると、Keycloak は Session を見てログイン済みと分かるため、入力は不要</li></ol><h4>ここまでのまとめ</h4><ul><li>Realm = 独立した管理単位 / Client = ログインを任せるアプリ</li><li>User・Role・Group = 人と権限</li><li>Client Scope・Mapper = トークンの中身 / IdP・User Federation = 外部との連携 / Authentication Flow = ログイン手順</li></ul><span class="trap">アプリ側のセッションと Keycloak 側の Session は別のもの。アプリ側のセッションを消しても、Keycloak にはログイン状態が残る (詳しくは第2章の logout)。</span>`,
        oxIds: ['c01-ox-10'] }
    ] }
  ],
  ox: [
    { id: 'c01-ox-01', text: `OIDC は、OAuth 2.0 の上に認証のための ID トークンを足したものである。`, answer: true,
      explain: `OAuth 2.0 は<b class="key">認可</b>の枠組みで、OIDC はその上に<b class="key">認証</b> (ID トークン) を足している。`, lesson: 'c01-l01' },
    { id: 'c01-ox-02', text: `OAuth 2.0 はもともと認証の枠組みで、OIDC はそこに認可 (アクセストークン) を足したものである。`, answer: false,
      explain: `関係が逆である。OAuth 2.0 が<b class="key">認可</b> (アクセストークンを渡す) の枠組みで、OIDC がその上に<b class="key">認証</b> (ID トークン) を足す。`, lesson: 'c01-l01' },
    { id: 'c01-ox-03', text: `Keycloak は、OAuth / OIDC の役割名でいうと Resource Server にあたる。`, answer: false,
      explain: `Keycloak は <b class="key">Authorization Server</b> である。Resource Server は、トークンを検証する側の API を指す。`, lesson: 'c01-l01' },
    { id: 'c01-ox-04', text: `realm が異なれば、同じ username のユーザーでも別人として扱われる。`, answer: true,
      explain: `realm はユーザーも設定も<b class="key">完全に別物</b>の独立した管理単位なので、同じ username でも別人扱いになる。`, lesson: 'c01-l02' },
    { id: 'c01-ox-05', text: `master realm は、業務アプリのユーザーをまとめるための標準の realm である。`, answer: false,
      explain: `<code>master</code> realm は <b class="key">Keycloak 自体の管理者用</b>である。業務アプリのユーザーは入れず、別の realm (例: <code>myrealm</code>) を作る。`, lesson: 'c01-l02' },
    { id: 'c01-ox-06', text: `グループにロールを付けると、そのグループのメンバー全員にロールが効く。`, answer: true,
      explain: `グループは<b class="key">ユーザーの束</b>であり、グループに付けたロールはメンバー全員に効く。ユーザー1人ずつに付ける手間が省ける。`, lesson: 'c01-l02' },
    { id: 'c01-ox-07', text: `ロールは「ユーザーの束」を表す部品で、グループは「権限のラベル」を表す部品である。`, answer: false,
      explain: `役割が逆である。<b class="key">ロール</b>が権限のラベル、<b class="key">グループ</b>がユーザーの束である。`, lesson: 'c01-l02' },
    { id: 'c01-ox-08', text: `Identity Provider (IdP) は Keycloak の外にあるログイン元のことで、Google や GitHub などが例になる。`, answer: true,
      explain: `IdP は <b class="key">Keycloak の外にある</b>ログイン元で、使うと「Google でログイン」のようなことができる。`, lesson: 'c01-l02' },
    { id: 'c01-ox-09', text: `User Federation は、Google や GitHub など外部のログイン元を Keycloak につなぐ機能である。`, answer: false,
      explain: `User Federation は LDAP / Active Directory などの<b class="key">既存のユーザー名簿</b>をつなぐ機能である。Google などの外部ログイン元は IdP の役割である。`, lesson: 'c01-l02' },
    { id: 'c01-ox-10', text: `Keycloak が「ログイン中」の状態を覚えているため、2つ目のアプリでは再度ログイン情報を入力せずに済む。これが SSO である。`, answer: true,
      explain: `Keycloak の <b class="key">Session</b> がログイン状態を保持しているので、別のアプリでも入力が不要になる。これが <b class="key">SSO</b> である。`, lesson: 'c01-l02' }
  ],
  mc: [
    { id: 'c01-mc-01', stem: `【組合せ型】Keycloak と関連規格に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `OAuth 2.0 は認可の枠組みであり、アクセストークンを渡す。` },
        { label: 'B', text: `OIDC は OAuth 2.0 とは独立した規格で、ID トークンの仕組みを一から定めている。` },
        { label: 'C', text: `SAML は XML ベースの SSO 規格で、企業内システム連携で現役である。` },
        { label: 'D', text: `Keycloak は OAuth / OIDC の役割名でいうと Resource Server である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ OAuth 2.0 は認可の枠組みで、アクセストークンを渡す。`,
        `B：× OIDC は OAuth 2.0 の上に認証 (ID トークン) を足したものであり、独立した規格ではない。`,
        `C：○ SAML は XML ベースの古い SSO 規格で、企業内システム連携で現役である。`,
        `D：× Keycloak は Authorization Server である。Resource Server は API を指す。`
      ],
      tip: `OAuth 2.0 は認可、OIDC はその上に認証を足したもの、SAML は別系統の XML ベース SSO と整理する。` },
    { id: 'c01-mc-02', stem: `【正誤選択型】Keycloak の構成要素に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `master realm には業務アプリのユーザーを入れて運用するのが基本である。`,
        `別の realm に同じ username のユーザーがいれば、同一人物として扱われる。`,
        `Client は、ログインする人の username や email、パスワードを保持する単位である。`,
        `グループにロールを付けると、そのグループのメンバー全員にロールが効く。`,
        `Identity Provider は、既存の LDAP のユーザー名簿を Keycloak につなぐ機能である。`
      ], answer: 4,
      explain: [
        `1：× master realm は Keycloak 自体の管理者用で、業務アプリのユーザーは入れない。`,
        `2：× realm が違えばユーザーは完全に別物で、同じ username でも別人扱いになる。`,
        `3：× それは User の説明である。Client は、ログインを任せるアプリ / API の登録情報である。`,
        `4：○ グループはユーザーの束で、付けたロールはメンバー全員に効く。`,
        `5：× 既存のユーザー名簿 (LDAP / AD) をつなぐのは User Federation である。IdP は外にあるログイン元を指す。`
      ],
      tip: `Realm は壁、Group は束、User Federation は名簿、IdP は外のログイン元と、部品ごとに役目を言い換える。` },
    { id: 'c01-mc-03', stem: `【組合せ型】Keycloak の構成要素に関する次の記述のうち、誤っているものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Client Scope は、トークンに載せる情報のセットである。` },
        { label: 'B', text: `Protocol Mapper は、Client Scope の中で claim を1つ作る部品である。` },
        { label: 'C', text: `Authentication Flow は、既存のユーザー名簿を Keycloak につなぐための定義である。` },
        { label: 'D', text: `User Federation は、ログイン手順 (パスワードの次に OTP など) を定義するものである。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：○ (記述は正しい) Client Scope は、トークンに載せる情報のセットである。`,
        `B：○ (記述は正しい) Protocol Mapper は、Client Scope の中の「claim を1つ作る部品」である。`,
        `C：× (誤り) 既存のユーザー名簿をつなぐのは User Federation である。Authentication Flow はログイン手順の定義である。`,
        `D：× (誤り) ログイン手順を定義するのは Authentication Flow である。User Federation は LDAP / AD などの名簿をつなぐ。`
      ],
      tip: `Flow は「手順」、Federation は「名簿」。C と D は互いの説明を入れ替えた誤りである。` },
    { id: 'c01-mc-04', stem: `【正誤選択型】登場人物と SSO に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        `Resource Owner はユーザー、Authorization Server は Keycloak にあたる。`,
        `Resource Server は、トークンを検証する側の API にあたる。`,
        `Client は、OAuth / OIDC の役割名では Authorization Server にあたる。`,
        `Client は、Keycloak にログインを任せるアプリの登録情報であり、1アプリ = 1 Client が基本である。`,
        `Keycloak が Session を覚えているため、2つ目のアプリでは再度パスワードを入力せずにログインできる。`
      ], answer: 3,
      explain: [
        `1：○ Resource Owner = ユーザー、Authorization Server = Keycloak である。`,
        `2：○ Resource Server は、トークンを検証する側の API である。`,
        `3：× Client はアプリ (役割名の Client) であり、Authorization Server は Keycloak である。`,
        `4：○ Client はログインを任せるアプリ / API の登録情報で、1アプリ = 1 Client が基本である。`,
        `5：○ Keycloak の Session があるため、別のアプリでの再入力が不要になる (SSO)。`
      ],
      tip: `Authorization Server は Keycloak、Client はアプリ。役割名と実体をセットで言えるようにする。` },
    { id: 'c01-mc-05', stem: `【組合せ型】Realm・Client・Session に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Client は、1アプリにつき複数作るのが基本である。` },
        { label: 'B', text: `realm が違えば、ユーザーも設定も完全に別物になる。` },
        { label: 'C', text: `URL の /realms/myrealm/ の myrealm の部分は、Client の名前を表す。` },
        { label: 'D', text: `Keycloak が Session を覚えていれば、2つ目のアプリではパスワードの再入力が不要になる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× 1アプリ = 1 Client が基本であり、<code>client_id</code> で識別する。`,
        `B：○ realm は独立した管理単位で、ユーザーも設定も完全に別物になる。`,
        `C：× <code>myrealm</code> は realm の名前である。Client は <code>client_id</code> で識別する。`,
        `D：○ Keycloak の Session が「ログイン中」を覚えているので、再入力が不要になる (SSO)。`
      ],
      tip: `URL の /realms/ の次は realm、Client は client_id。Session は Keycloak 側が覚えているから SSO になる。` },
    { id: 'c01-mc-06', stem: `【正誤選択型】Keycloak の部品の役割に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `Protocol Mapper は、トークンに載せる情報のセットである Client Scope の中で、claim を1つ作る部品である。`,
        `Role は、ユーザーを束ねるための単位である。`,
        `Authentication Flow は、Google など外部のログイン元を表す設定である。`,
        `User Federation は、ログイン手順を定める設定である。`,
        `Identity Provider は、Keycloak の内部にだけ存在するユーザー管理機能である。`
      ], answer: 1,
      explain: [
        `1：○ Client Scope がトークンに載せる情報のセットで、Protocol Mapper はその中の「claim を1つ作る部品」である。`,
        `2：× ユーザーを束ねるのは Group である。Role は権限のラベルである。`,
        `3：× 外部のログイン元は Identity Provider である。Authentication Flow はログイン手順の定義である。`,
        `4：× ログイン手順を定めるのは Authentication Flow である。User Federation は既存のユーザー名簿をつなぐ。`,
        `5：× IdP は Keycloak の外にあるログイン元である。`
      ],
      tip: `Scope は「セット」、Mapper は「1つ作る部品」。包含関係 (Scope の中に Mapper) で覚える。` }
  ]
});
DATA.chapters.push({
  no: 2, title: `主要エンドポイント(OIDC)`,
  lessons: [
    { id: 'c02-l01', title: `Discovery と認可・トークン・userinfo・jwks・introspection`, pages: [
      { id: 'c02-l01-p01', title: `Discovery: まず見る場所`,
        html: `<h4>Discovery とは</h4><p>Keycloak の各エンドポイントの URL は、1か所の <b class="key">Discovery</b> から辿れる。</p><pre>GET http://localhost:8080/realms/myrealm/.well-known/openid-configuration</pre><p>ここに以降で説明するすべての URL が載っている。<b class="key">まずここを見る</b>のが基本である。</p><h4>主要エンドポイントの一覧</h4><p>パスはいずれも <code>/realms/myrealm/protocol/openid-connect</code> から始まる。</p><table><tr><th>名前</th><th>末尾のパス</th></tr><tr><td><b class="key">authorization_endpoint</b></td><td><code>/auth</code></td></tr><tr><td><b class="key">token_endpoint</b></td><td><code>/token</code></td></tr><tr><td><b class="key">userinfo_endpoint</b></td><td><code>/userinfo</code></td></tr><tr><td><b class="key">jwks_uri</b></td><td><code>/certs</code></td></tr><tr><td><b class="key">introspection_endpoint</b></td><td><code>/token/introspect</code></td></tr><tr><td><b class="key">end_session_endpoint</b></td><td><code>/logout</code></td></tr><tr><td><b class="key">device_authorization_endpoint</b></td><td><code>/auth/device</code></td></tr><tr><td><b class="key">revocation_endpoint</b></td><td><code>/revoke</code></td></tr></table><span class="trap">名前 (authorization_endpoint など) とパス (<code>/auth</code> など) は一致しない。jwks_uri が <code>/certs</code> であるように、名前から推測せず Discovery で確認する。</span>`,
        oxIds: ['c02-ox-01', 'c02-ox-02'] },
      { id: 'c02-l01-p02', title: `認可エンドポイント (authorization_endpoint)`,
        html: `<h4>どんなエンドポイントか</h4><p><code>/realms/myrealm/protocol/openid-connect/auth</code> は、<b class="key">ユーザーのブラウザ</b>が開く「ログイン画面の入口」である。</p><ul><li><b class="key">誰が呼ぶ</b>: ブラウザ (アプリがリダイレクトさせる)。curl で叩くものではない</li><li><b class="key">何をする</b>: ユーザー認証 + 同意 → <code>code</code> を <code>redirect_uri</code> に付けて返す</li><li><b class="key">使う場面</b>: Authorization Code Flow の最初の一歩</li></ul><h4>主なパラメータ</h4><p><code>client_id</code> (どの Client か)、<code>response_type=code</code> (code を要求する)、<code>redirect_uri</code> (code を返す先)、<code>scope</code>、<code>state</code>、<code>nonce</code>、<code>code_challenge</code> を渡す。<code>state</code>・<code>nonce</code>・<code>code_challenge</code> の意味は第7章で扱う。</p><span class="trap">アプリのバックエンドが直接呼ぶのではなく、ユーザーのブラウザがログイン画面を開く入口である。この点が token エンドポイントとの大きな違いになる。</span>`,
        oxIds: ['c02-ox-03', 'c02-ox-04'] },
      { id: 'c02-l01-p03', title: `トークンエンドポイント (token_endpoint)`,
        html: `<h4>最重要のエンドポイント</h4><p><code>/realms/myrealm/protocol/openid-connect/token</code> は<b class="key">トークンを発行する窓口</b>である。</p><ul><li><b class="key">誰が呼ぶ</b>: アプリのバックエンド / SPA が<b class="key">直接 POST</b> する (ブラウザを介さないバックチャネルの通信)</li><li><b class="key">何をする</b>: <code>grant_type</code> に応じて access / id / refresh token を返す</li><li>Client authentication ON のクライアントは、ここで secret 等を提示する</li></ul><h4>grant_type の値</h4><table><tr><th>grant_type</th><th>意味</th></tr><tr><td><code>authorization_code</code></td><td>code をトークンに交換</td></tr><tr><td><code>client_credentials</code></td><td>サーバー間</td></tr><tr><td><code>refresh_token</code></td><td>再発行</td></tr><tr><td><code>password</code></td><td>ID / PW を直接渡す (非推奨)</td></tr><tr><td><code>urn:ietf:params:oauth:grant-type:device_code</code></td><td>デバイスフロー</td></tr><tr><td><code>urn:ietf:params:oauth:grant-type:token-exchange</code></td><td>トークン交換</td></tr></table><span class="trap"><code>authorization_code</code> は「code → トークン」の交換、<code>client_credentials</code> は「サーバー間」。名前が似て見えても用途は別である。</span>`,
        oxIds: ['c02-ox-05', 'c02-ox-06'] },
      { id: 'c02-l01-p04', title: `userinfo・jwks_uri・introspection`,
        html: `<h4>userinfo_endpoint</h4><p><code>/userinfo</code> は、アクセストークンの持ち主の<b class="key">プロフィール claim を返す API</b> である。クライアントが <code>Authorization: Bearer &lt;access_token&gt;</code> を付けて GET / POST する。返り値の例は次のとおり。</p><pre>{"sub":"8b1d...","preferred_username":"taro","email":"taro@example.com"}</pre><p>ID Token / Access Token を軽くして、詳細だけ後から取りたいときに使う。Mapper の「Add to userinfo」が ON の claim が返る。</p><h4>jwks_uri</h4><p><code>/certs</code> は、トークンの署名検証用の<b class="key">公開鍵一覧 (JWKS)</b> を返す。<b class="key">認証不要</b>で誰でも GET できる。JWT header の <code>kid</code> と一致する鍵で署名を検証し、取得結果はキャッシュする。鍵ローテーション時は複数の鍵が載る。</p><h4>introspection_endpoint</h4><p><code>/token/introspect</code> (RFC 7662) は、「このトークンはまだ有効か」を <b class="key">Keycloak に問い合わせる</b>窓口である。呼ぶのは API (Resource Server) で、<b class="key">クライアント認証が必要</b>。有効なら <code>{"active":true,"sub":...,"scope":...}</code>、無効なら <code>{"active":false}</code> が返る。</p><span class="trap">JWKS によるローカル検証と違い、introspection はログアウト / 失効が<b class="key">即反映</b>されるが、毎回 Keycloak への通信が発生する。</span>`,
        oxIds: ['c02-ox-07', 'c02-ox-08'] }
    ] },
    { id: 'c02-l02', title: `logout・device・revoke・issuer・呼び出し元整理・注意`, pages: [
      { id: 'c02-l02-p01', title: `logout と device_authorization`,
        html: `<h4>end_session_endpoint (ログアウト)</h4><ul><li><code>/realms/myrealm/protocol/openid-connect/logout</code></li><li>Keycloak の <b class="key">SSO セッションを終了</b>させる</li><li>誰が呼ぶ: ブラウザ (GET でリダイレクト) / アプリのバックエンド (POST で <code>refresh_token</code> を渡す)</li><li>主なパラメータ: <code>id_token_hint</code>, <code>post_logout_redirect_uri</code>, <code>state</code></li></ul><span class="trap">アプリ側のセッションを消すだけでは、Keycloak にはログイン状態が残る。Keycloak 側を終わらせるには、このエンドポイントを使う。</span><h4>device_authorization_endpoint</h4><ul><li><code>/realms/myrealm/protocol/openid-connect/auth/device</code></li><li>TV / CLI などブラウザで入力しにくい機器向けの<b class="key">開始窓口</b>。デバイス側アプリが POST する</li><li>返り値: <code>device_code</code>, <code>user_code</code>, <code>verification_uri</code>, <code>interval</code></li><li>以降: ユーザーが別端末で承認 → デバイスが token_endpoint を<b class="key">ポーリング</b>する</li></ul>`,
        oxIds: ['c02-ox-09', 'c02-ox-10'] },
      { id: 'c02-l02-p02', title: `revocation_endpoint と issuer`,
        html: `<h4>revocation_endpoint (トークン失効)</h4><ul><li><code>/realms/myrealm/protocol/openid-connect/revoke</code> (RFC 7009)</li><li>指定した Refresh / Access Token を<b class="key">無効化</b>する</li><li>誰が呼ぶ: クライアントが POST する (<code>token=...</code>、クライアント認証あり)</li><li>使う場面: ユーザーのログアウト時や、トークン漏洩が疑われるとき</li></ul><h4>issuer (エンドポイントではなく識別子)</h4><pre>http://localhost:8080/realms/myrealm</pre><ul><li>トークンの <code>iss</code> と<b class="key">一致する値</b></li><li>Spring の <code>issuer-uri</code> にはこれを指定する</li></ul><span class="trap">issuer は呼び出して使う窓口ではなく、「誰が発行したか」を表す識別子である。token の URL などと取り違えない。</span>`,
        oxIds: ['c02-ox-11'] },
      { id: 'c02-l02-p03', title: `Discovery に載るその他のエンドポイント`,
        html: `<h4>主要なもの以外に載るもの</h4><p>Discovery には、これまで見てきたもの以外にも次のような項目が載る。名前と用途の対応を押さえておく。</p><table><tr><th>項目</th><th>用途</th></tr><tr><td><code>registration_endpoint</code></td><td><b class="key">Dynamic Client Registration</b> (クライアントの自動登録)</td></tr><tr><td><code>check_session_iframe</code></td><td>ブラウザ側のセッション状態監視用</td></tr><tr><td><code>backchannel_authentication_endpoint</code></td><td><b class="key">CIBA</b> (ユーザー操作を別端末で承認)</td></tr><tr><td><code>pushed_authorization_request_endpoint</code></td><td><b class="key">PAR</b> (認可リクエストを事前にサーバー送信)</td></tr><tr><td><code>mtls_endpoint_aliases</code></td><td>mTLS 用の別 URL</td></tr></table><span class="trap">CIBA は「別端末での承認」、PAR は「認可リクエストの事前送信」。略称だけで覚えず、何を解決するものかで区別する。</span>`,
        oxIds: ['c02-ox-12'] },
      { id: 'c02-l02-p04', title: `呼び出し元の整理・流れ・注意`,
        html: `<h4>誰が呼ぶかで分類する</h4><ul><li><b class="key">ブラウザが開く</b>: authorization, end_session</li><li><b class="key">アプリ / サーバーが直接叩く (認証あり)</b>: token, introspection, revocation, device_authorization</li><li><b class="key">Bearer 付きで叩く</b>: userinfo</li><li><b class="key">誰でも取得できる</b>: discovery, jwks_uri</li></ul><h4>流れの中での位置づけ</h4><ul><li>ログイン: discovery → <b class="key">auth</b> → (ログイン) → <b class="key">token</b> → API 呼び出し (API は <b class="key">certs</b> で検証)</li><li>補助: <b class="key">userinfo</b> (詳細取得)、<b class="key">introspect</b> (即時失効確認)、<b class="key">revoke</b> (失効)</li><li>終了: <b class="key">logout</b></li></ul><span class="trap">Keycloak 17 以降 (Quarkus 版) は <code>/auth</code> プレフィックスなし。旧 WildFly 版は <code>/auth/realms/...</code> の形だった。古い資料の URL をそのまま使わない。</span>`,
        oxIds: ['c02-ox-13', 'c02-ox-14'] }
    ] }
  ],
  ox: [
    { id: 'c02-ox-01', text: `各エンドポイントの URL は、Discovery (<code>.well-known/openid-configuration</code>) に載っているので、まずそこを見ればよい。`, answer: true,
      explain: `Discovery に主要なエンドポイントの URL がまとまって載っている。<b class="key">まず Discovery を見る</b>のが基本である。`, lesson: 'c02-l01' },
    { id: 'c02-ox-02', text: `token_endpoint のパスは <code>/realms/myrealm/protocol/openid-connect/userinfo</code> である。`, answer: false,
      explain: `token_endpoint は <code>.../token</code> である。<code>.../userinfo</code> は <b class="key">userinfo_endpoint</b> のパスである。`, lesson: 'c02-l01' },
    { id: 'c02-ox-03', text: `認可エンドポイントは、アプリのバックエンドが curl などで直接 POST して呼び出すものである。`, answer: false,
      explain: `認可エンドポイントを開くのは<b class="key">ユーザーのブラウザ</b> (アプリがリダイレクトさせる) で、curl で叩くものではない。直接 POST するのは token エンドポイントである。`, lesson: 'c02-l01' },
    { id: 'c02-ox-04', text: `認可エンドポイントは、ユーザー認証と同意のあと、<code>code</code> を <code>redirect_uri</code> に付けて返す。`, answer: true,
      explain: `認可エンドポイントは認証 + 同意のあと、<b class="key">code</b> を <code>redirect_uri</code> に付けて返す。この code を token エンドポイントでトークンに交換する。`, lesson: 'c02-l01' },
    { id: 'c02-ox-05', text: `token エンドポイントは、<code>grant_type</code> の値に応じて access / id / refresh token を返す。`, answer: true,
      explain: `token エンドポイントは<b class="key">トークンを発行する窓口</b>で、<code>grant_type</code> (どの方法で要求するか) に応じてトークンを返す。`, lesson: 'c02-l01' },
    { id: 'c02-ox-06', text: `<code>grant_type=client_credentials</code> は、code をトークンに交換するときに使う値である。`, answer: false,
      explain: `code をトークンに交換するのは <code>authorization_code</code> である。<code>client_credentials</code> は<b class="key">サーバー間</b>で使う。`, lesson: 'c02-l01' },
    { id: 'c02-ox-07', text: `jwks_uri は認証なしで誰でも GET でき、JWT header の <code>kid</code> と一致する鍵で署名を検証する。`, answer: true,
      explain: `jwks_uri は<b class="key">認証不要</b>の公開鍵一覧で、トークンの <code>kid</code> と一致する鍵を探して署名を検証する。結果はキャッシュする。`, lesson: 'c02-l01' },
    { id: 'c02-ox-08', text: `introspection エンドポイントは、クライアント認証なしで誰でも呼び出せる。`, answer: false,
      explain: `introspection は<b class="key">呼び出し側のクライアント認証が必要</b>である。誰でも GET できるのは jwks_uri の方である。`, lesson: 'c02-l01' },
    { id: 'c02-ox-09', text: `アプリ側のセッションを消せば、Keycloak 側のログイン状態も同時に終了する。`, answer: false,
      explain: `アプリ側のセッションを消しても、Keycloak には<b class="key">SSO セッションが残る</b>。終了させるには end_session_endpoint (logout) を使う。`, lesson: 'c02-l02' },
    { id: 'c02-ox-10', text: `デバイス認可フローでは、ユーザーが別端末で承認し、デバイス側は token_endpoint をポーリングしてトークンを得る。`, answer: true,
      explain: `デバイス側は開始後、ユーザーの承認が済むまで <b class="key">token_endpoint をポーリング</b>する。入力しにくい機器のために承認を別端末に逃がす仕組みである。`, lesson: 'c02-l02' },
    { id: 'c02-ox-11', text: `issuer は呼び出して使うエンドポイントの1つで、トークンの <code>iss</code> とは無関係な値である。`, answer: false,
      explain: `issuer は<b class="key">エンドポイントではなく識別子</b>で、トークンの <code>iss</code> と一致する値である。Spring の <code>issuer-uri</code> にはこれを指定する。`, lesson: 'c02-l02' },
    { id: 'c02-ox-12', text: `registration_endpoint は、Dynamic Client Registration、つまりクライアントの自動登録のためのエンドポイントである。`, answer: true,
      explain: `registration_endpoint は <b class="key">Dynamic Client Registration</b> (クライアントの自動登録) 用である。`, lesson: 'c02-l02' },
    { id: 'c02-ox-13', text: `token・introspection・revocation・device_authorization は、ブラウザが開く画面ではなく、アプリやサーバーが認証付きで直接呼ぶエンドポイントである。`, answer: true,
      explain: `ブラウザが開くのは authorization と end_session である。これらはアプリ / サーバーが<b class="key">直接 (認証あり)</b> 呼ぶ。`, lesson: 'c02-l02' },
    { id: 'c02-ox-14', text: `Keycloak 17 以降 (Quarkus 版) の URL には <code>/auth</code> プレフィックスが付き、旧 WildFly 版には付かない。`, answer: false,
      explain: `逆である。Keycloak 17 以降 (Quarkus 版) は <code>/auth</code> プレフィックス<b class="key">なし</b>で、旧 WildFly 版が <code>/auth/realms/...</code> の形だった。`, lesson: 'c02-l02' }
  ],
  mc: [
    { id: 'c02-mc-01', stem: `【組合せ型】エンドポイントを誰が呼ぶかに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `authorization_endpoint は、ユーザーのブラウザが開くログイン画面の入口である。` },
        { label: 'B', text: `token_endpoint は、ブラウザがリダイレクトで開く入口である。` },
        { label: 'C', text: `jwks_uri は、認証なしで誰でも GET できる。` },
        { label: 'D', text: `introspection_endpoint は、認証なしで誰でも呼び出せる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ 認可エンドポイントはブラウザが開く入口である。`,
        `B：× token_endpoint は、アプリのバックエンド / SPA が直接 POST する。ブラウザが開くのは認可エンドポイントである。`,
        `C：○ jwks_uri は認証不要で誰でも GET できる。`,
        `D：× introspection は、呼び出し側のクライアント認証が必要である。`
      ],
      tip: `ブラウザが開くのは auth と logout、直接叩くのは token など、誰でも取れるのは discovery と jwks_uri と分けて覚える。` },
    { id: 'c02-mc-02', stem: `【正誤選択型】ログアウトとトークン失効に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `アプリ側のセッションを消せば、Keycloak の SSO セッションも自動的に終了する。`,
        `end_session_endpoint は、アプリのバックエンドから直接 GET する場合に限り使える。`,
        `revocation_endpoint は、指定した Refresh Token や Access Token を無効化するために、クライアントが POST して呼ぶ。`,
        `revocation_endpoint は、トークンがまだ有効かどうかを Keycloak に問い合わせるために使う。`,
        `device_authorization_endpoint は、ブラウザから開いてログインするための入口である。`
      ], answer: 3,
      explain: [
        `1：× アプリ側のセッションを消しても、Keycloak にはログイン状態が残る。`,
        `2：× end_session_endpoint は、ブラウザ (GET でリダイレクト) とアプリのバックエンド (POST で refresh_token を渡す) の両方から使える。`,
        `3：○ revocation_endpoint はトークンを無効化するもので、クライアントが POST して呼ぶ。`,
        `4：× 有効かどうかを問い合わせるのは introspection_endpoint である。`,
        `5：× device_authorization_endpoint は、TV / CLI などのデバイス側アプリが POST する開始窓口である。`
      ],
      tip: `revoke は「無効にする」、introspect は「有効か聞く」。動詞で区別する。` },
    { id: 'c02-mc-03', stem: `【組合せ型】トークンの検証方法に関する次の記述のうち、誤っているものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `introspection は、ログアウトや失効が即座に反映されるが、毎回 Keycloak への通信が発生する。` },
        { label: 'B', text: `jwks_uri から取得した公開鍵は、キャッシュして使う。` },
        { label: 'C', text: `introspection は、呼び出し側の認証が不要である。` },
        { label: 'D', text: `jwks_uri の結果には、鍵ローテーション中でも常に1つの鍵しか載らない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：○ (記述は正しい) introspection は即時に反映されるが、毎回通信が必要になる。`,
        `B：○ (記述は正しい) JWKS の取得結果はキャッシュして使う。`,
        `C：× (誤り) introspection は、呼び出し側のクライアント認証が必要である。`,
        `D：× (誤り) 鍵ローテーション時は複数の鍵が載る。だから kid で一致する鍵を探す。`
      ],
      tip: `introspection は「毎回聞く = 即時だが通信あり + 認証必須」、JWKS は「鍵を取ってキャッシュ + 認証不要」と対で覚える。` },
    { id: 'c02-mc-04', stem: `【正誤選択型】token_endpoint と grant_type に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `authorization_code は code をトークンに交換する値、client_credentials はサーバー間通信で使う値である。`,
        `refresh_token は、ID とパスワードを直接渡してトークンを得る値である。`,
        `password は、推奨される標準的な grant_type である。`,
        `token_endpoint は、ブラウザがリダイレクトで開く画面である。`,
        `Client authentication ON のクライアントは、token_endpoint で secret 等を提示しない。`
      ], answer: 1,
      explain: [
        `1：○ authorization_code は code → トークンの交換、client_credentials はサーバー間である。`,
        `2：× ID / PW を直接渡すのは password (非推奨) である。refresh_token は再発行用である。`,
        `3：× password は非推奨である。`,
        `4：× token_endpoint は、アプリのバックエンド / SPA が直接 POST する。ブラウザが開くのは認可エンドポイントである。`,
        `5：× Client authentication ON のクライアントは、token_endpoint で secret 等を提示する。`
      ],
      tip: `grant_type は「どの方法でトークンを求めるか」。値の名前を用途の言葉に言い換えて区別する。` },
    { id: 'c02-mc-05', stem: `【組合せ型】Discovery と issuer に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `issuer は token_endpoint の別名であり、POST して使う。` },
        { label: 'B', text: `Spring の issuer-uri には、issuer (トークンの iss と一致する値) を指定する。` },
        { label: 'C', text: `Discovery には token_endpoint の URL は載っておらず、別途ドキュメントで調べる必要がある。` },
        { label: 'D', text: `旧 WildFly 版の URL は /auth/realms/... の形だった。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× issuer はエンドポイントではなく識別子であり、POST して使うものではない。`,
        `B：○ Spring の issuer-uri には、トークンの iss と一致する issuer を指定する。`,
        `C：× Discovery には主要エンドポイントの URL がすべて載っている。まず Discovery を見る。`,
        `D：○ 旧 WildFly 版は /auth/realms/... で、Keycloak 17 以降 (Quarkus 版) は /auth なしである。`
      ],
      tip: `issuer は「呼ぶ先」ではなく「名乗り」。iss と一致する値を設定に渡す、と言い換える。` },
    { id: 'c02-mc-06', stem: `【正誤選択型】エンドポイントを呼ぶ主体に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        `authorization_endpoint は、アプリがブラウザをリダイレクトさせて開く。`,
        `jwks_uri は、呼び出すのにクライアントの secret が必要である。`,
        `userinfo_endpoint は、Authorization: Bearer ヘッダーにアクセストークンを付けて呼び出す。`,
        `introspection_endpoint は、呼び出す API 側のクライアント認証が必要である。`,
        `device_authorization_endpoint は、デバイス側のアプリが POST して開始する。`
      ], answer: 2,
      explain: [
        `1：○ 認可エンドポイントは、アプリがブラウザをリダイレクトさせて開く。`,
        `2：× jwks_uri は認証不要で、誰でも GET できる。`,
        `3：○ userinfo は Bearer 付きで呼び出す。`,
        `4：○ introspection は呼び出し側のクライアント認証が必要である。`,
        `5：○ デバイス側のアプリが POST して開始する。`
      ],
      tip: `公開鍵は誰でも取れて当然、トークンの有効性を聞く窓口は認証が必要、と理由とセットで覚える。` },
    { id: 'c02-mc-07', stem: `【組合せ型】Discovery に載るその他のエンドポイントに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `registration_endpoint は、PAR (認可リクエストの事前送信) のためのエンドポイントである。` },
        { label: 'B', text: `backchannel_authentication_endpoint は、ユーザー操作を別端末で承認する CIBA のためのものである。` },
        { label: 'C', text: `pushed_authorization_request_endpoint は、認可リクエストを事前にサーバー送信する PAR のためのものである。` },
        { label: 'D', text: `mtls_endpoint_aliases は、ブラウザ側のセッション状態を監視するためのものである。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× registration_endpoint は Dynamic Client Registration (クライアントの自動登録) である。PAR は pushed_authorization_request_endpoint である。`,
        `B：○ backchannel_authentication_endpoint は CIBA (ユーザー操作を別端末で承認) である。`,
        `C：○ pushed_authorization_request_endpoint は PAR (認可リクエストを事前にサーバー送信) である。`,
        `D：× mtls_endpoint_aliases は mTLS 用の別 URL である。ブラウザ側のセッション監視は check_session_iframe である。`
      ],
      tip: `CIBA は「別端末で承認」、PAR は「先にサーバーへ送る」、DCR は「クライアントの自動登録」と、解決する課題で覚える。` }
  ]
});
DATA.chapters.push({
  no: 3, title: `トークンと Claim`,
  lessons: [
    { id: 'c03-l01', title: `Claim とは・トークン種類・JWT構造`, pages: [
      { id: 'c03-l01-p01', title: `そもそも Claim とは`,
        html: `<h4>claim = トークンの中の「1つの情報」</h4><p><b class="key">claim (クレーム)</b> は、トークンの中に入っている<b class="key">名前と値のペア</b>である。英語の意味は「主張」で、「この人は taro です」「メールは taro@example.com です」とトークンが主張しているイメージを持つとよい。</p><p>JWT の payload (JSON) の <code>"キー": 値</code> の1行が 1 claim にあたる。</p><pre>{ "preferred_username": "taro", "email": "taro@example.com" }</pre><p>この例は claim が 2 つ。名前 = <code>preferred_username</code>、値 = <code>"taro"</code> である。</p><h4>claim の種類</h4><ul><li><b class="key">標準 claim</b>: 仕様で名前が決まっている (<code>iss</code>, <code>sub</code>, <code>aud</code>, <code>exp</code>, <code>email</code>, <code>name</code> ...)</li><li><b class="key">Keycloak 独自</b>: <code>realm_access</code>, <code>resource_access</code> など</li><li><b class="key">カスタム claim</b>: 自分で作る (<code>dept</code>, <code>tenant</code> など)。Mapper で作る → 第4章</li></ul><p>「トークンに何を載せるか」は「どの claim を入れるか」と同じ意味であり、それを決めるのが Mapper である。</p>`,
        oxIds: ['c03-ox-01', 'c03-ox-02'] },
      { id: 'c03-l01-p02', title: `トークンの種類と宛先`,
        html: `<h4>4種類のトークン</h4><table><tr><th>種類</th><th>役割</th><th>宛先</th><th>typ</th></tr><tr><td><b class="key">Access Token</b></td><td>API を呼ぶための通行証</td><td>API (Resource Server)</td><td><code>Bearer</code></td></tr><tr><td><b class="key">ID Token</b></td><td>「誰がログインしたか」をクライアントに伝える</td><td>Client 自身</td><td><code>ID</code></td></tr><tr><td><b class="key">Refresh Token</b></td><td>アクセストークンの再発行用</td><td>Keycloak 自身 (<code>aud</code> = realm の issuer URL)</td><td><code>Refresh</code></td></tr></table><p>Keycloak の Access Token は JWT 形式である。</p><ul><li><b class="key">Offline Token</b>: 長期の Refresh Token。<code>scope=offline_access</code> で要求する</li></ul><h4>宛先で区別する</h4><p>同じ JWT でも、使う相手が違う。Access Token は API に見せるもの、ID Token はクライアントが「誰が来たか」を知るためのもの、Refresh Token は Keycloak に出して新しいトークンをもらうためのものである。</p><span class="trap">ID Token を API を呼ぶ通行証として使うものではない。宛先は Client 自身である。</span>`,
        oxIds: ['c03-ox-03', 'c03-ox-04'] },
      { id: 'c03-l01-p03', title: `JWT の構造`,
        html: `<h4>3つの部分</h4><p>JWT は <code>header.payload.signature</code> の形をしている。それぞれを <b class="key">Base64URL</b> でエンコードし、<code>.</code> でつないだものである。</p><ul><li><b class="key">header</b>: 署名の方式や鍵の情報</li><li><b class="key">payload</b>: claim を入れた JSON</li><li><b class="key">signature</b>: 署名</li></ul><h4>header の例</h4><pre>{ "alg": "RS256", "typ": "JWT", "kid": "abc123..." }</pre><p><b class="key">kid</b> は「どの鍵で署名したか」を表す。API は JWKS (第2章の jwks_uri) から、同じ <code>kid</code> の公開鍵を探して署名を検証する。</p><span class="trap">header の <code>typ</code> (例では <code>JWT</code>) と、payload の <code>typ</code> (<code>Bearer</code> / <code>ID</code> / <code>Refresh</code>) は別のものである。</span>`,
        oxIds: ['c03-ox-05', 'c03-ox-06'] }
    ] },
    { id: 'c03-l02', title: `payload 例と標準 Claim`, pages: [
      { id: 'c03-l02-p01', title: `Access Token の payload 例`,
        html: `<h4>全体像</h4><p>Access Token の payload は、おおむね次のような形をしている。</p><pre>{
  "exp": 1760000300,
  "iat": 1760000000,
  "jti": "5f1c0e0a-1111-2222-3333-444455556666",
  "iss": "http://localhost:8080/realms/myrealm",
  "aud": ["backend-api", "account"],
  "sub": "8b1d6c3e-aaaa-bbbb-cccc-1234567890ab",
  "typ": "Bearer",
  "azp": "frontend-spa",
  "sid": "e0f1a2b3-....",
  "acr": "1",
  "allowed-origins": ["http://localhost:3000"],
  "realm_access": { "roles": ["user", "offline_access"] },
  "resource_access": {
    "backend-api": { "roles": ["read", "write"] },
    "account": { "roles": ["manage-account", "view-profile"] }
  },
  "scope": "openid profile email",
  "email_verified": true,
  "name": "Taro Yamada",
  "preferred_username": "taro",
  "given_name": "Taro",
  "family_name": "Yamada",
  "email": "taro@example.com"
}</pre><h4>見るときのグルーピング</h4><ul><li>有効期間・識別: <code>exp</code>, <code>iat</code>, <code>jti</code></li><li>発行者・宛先・主体: <code>iss</code>, <code>aud</code>, <code>sub</code>, <code>azp</code></li><li>権限: <code>realm_access</code>, <code>resource_access</code>, <code>scope</code></li><li>ユーザー情報: <code>name</code>, <code>preferred_username</code>, <code>email</code> など</li></ul>`,
        oxIds: ['c03-ox-07'] },
      { id: 'c03-l02-p02', title: `iss と sub`,
        html: `<h4>iss (Issuer): 誰が発行したか</h4><ul><li>Keycloak の realm の URL。例 <code>"iss": "http://localhost:8080/realms/myrealm"</code></li><li>検証: 自分が信頼する issuer と<b class="key">完全一致</b>するか</li></ul><span class="trap"><code>localhost:8080</code> と <code>keycloak:8080</code> (Docker 内) など、アクセスするホスト名で iss の値が変わる。フロント URL (Frontend URL / <code>KC_HOSTNAME</code>) を固定して揃える。reverse proxy 越しなら <code>https://auth.example.com/realms/myrealm</code> のようになる。</span><h4>sub (Subject): ユーザーを一意に示す ID</h4><ul><li>Keycloak では <b class="key">UUID</b>。例 <code>"sub": "8b1d6c3e-aaaa-bbbb-cccc-1234567890ab"</code></li><li>email や username は<b class="key">変わりうる</b>ので、DB の紐付けキーには <b class="key">sub</b> を使う</li><li>client_credentials の場合は「service account ユーザー」の UUID</li></ul>`,
        oxIds: ['c03-ox-08', 'c03-ox-09'] },
      { id: 'c03-l02-p03', title: `aud と azp`,
        html: `<h4>aud (Audience): このトークンは誰宛か</h4><ul><li>例 <code>"aud": ["backend-api", "account"]</code> (文字列 1 個のこともある)</li><li>API 側の検証: <b class="key">自分の名前が aud に入っていなければ拒否</b>する</li><li>なぜ必要か: トークンを別 API に使い回されるのを防ぐ (Confused Deputy 対策)</li><li>ID Token の aud は、発行先の client_id (例 <code>"aud": "frontend-spa"</code>)</li></ul><h4>Keycloak の挙動</h4><p>デフォルトでは <code>account</code> しか入らないことが多い。自分の API 名を入れるには <b class="key">Audience Mapper</b> か <b class="key">Audience Resolve</b> を使う (第4章)。</p><h4>azp (Authorized Party): 要求したクライアント</h4><p>azp は「トークンを<b class="key">要求した</b>クライアント」、つまり呼び出し元アプリである。aud (宛先) と azp (要求者) は別物である。</p><pre>SPA frontend-spa が API backend-api 向けトークンを取得
  → azp = frontend-spa, aud = backend-api</pre><span class="trap">aud = 宛先、azp = 要求者。取り違えやすいので、「誰宛か」と「誰が頼んだか」で区別する。</span>`,
        oxIds: ['c03-ox-10', 'c03-ox-11'] },
      { id: 'c03-l02-p04', title: `exp・iat・nbf・jti・typ`,
        html: `<h4>時刻に関する claim</h4><ul><li><b class="key">exp</b> (Expiration): 有効期限 (UNIX 秒)。デフォルトの Access Token は <b class="key">5 分</b> (Realm settings → Tokens)</li><li><b class="key">iat</b> (Issued At): 発行時刻</li><li><b class="key">nbf</b> (Not Before): この時刻より前は無効</li></ul><p>前ページの payload 例では <code>exp</code> が 1760000300、<code>iat</code> が 1760000000 で、差は 300 秒 = 5 分である。デフォルトの寿命と一致している。</p><h4>識別に関する claim</h4><ul><li><b class="key">jti</b> (JWT ID): トークン固有の ID。リプレイ検知・失効管理に使える</li><li><b class="key">typ</b>: トークン種別 (<code>Bearer</code> / <code>ID</code> / <code>Refresh</code>)</li></ul><span class="trap">exp は「ここまで有効」、nbf は「ここから有効」。どちらも時刻だが向きが逆である。</span>`,
        oxIds: ['c03-ox-12', 'c03-ox-13'] },
      { id: 'c03-l02-p05', title: `scope・sid・auth_time・nonce・acr ほか`,
        html: `<h4>その他の標準 claim</h4><table><tr><th>claim</th><th>意味</th></tr><tr><td><b class="key">scope</b></td><td>付与されたスコープ (スペース区切り)。例 <code>"scope": "openid profile email"</code></td></tr><tr><td><b class="key">sid</b></td><td>セッション ID (Keycloak の SSO セッション)</td></tr><tr><td><b class="key">auth_time</b></td><td>ユーザーが<b class="key">実際に認証した時刻</b></td></tr><tr><td><b class="key">nonce</b></td><td>ID Token のリプレイ防止。認可リクエストで送った値がそのまま返る</td></tr><tr><td><b class="key">acr</b></td><td>認証強度 (Level of Authentication。MFA 済みなど)</td></tr><tr><td><b class="key">at_hash / c_hash</b></td><td>他トークンとの紐付けハッシュ (ID Token)</td></tr></table><span class="trap">iat は「トークンを発行した時刻」、auth_time は「ユーザーが実際に認証した時刻」。意味の違う別の claim である。</span>`,
        oxIds: ['c03-ox-14'] }
    ] },
    { id: 'c03-l03', title: `Keycloak 独自 Claim・読み方`, pages: [
      { id: 'c03-l03-p01', title: `Keycloak 独自の Claim とトークンの読み方`,
        html: `<h4>Keycloak 独自 Claim</h4><ul><li><code>realm_access.roles</code> = <b class="key">Realm Role</b></li><li><code>resource_access.&lt;client&gt;.roles</code> = <b class="key">Client Role</b></li><li><code>preferred_username</code>: ログイン名</li><li><code>allowed-origins</code>: Web Origins 設定値</li><li><code>groups</code>: Group Membership Mapper を作ったときに載る</li></ul><h4>読み方のコツ</h4><ul><li>https://jwt.io に貼って decode する。ただし<b class="key">本番トークンは貼らない</b></li><li>CLI では次のようにする (padding に注意)</li></ul><pre>echo "&lt;payload部分&gt;" | base64 -d | jq</pre><span class="trap">本番のトークンを外部サイトに貼ると、その中の情報を第三者に渡すことになる。確認は開発用トークンで行う。</span>`,
        oxIds: ['c03-ox-15', 'c03-ox-16'] }
    ] }
  ],
  ox: [
    { id: 'c03-ox-01', text: `JWT の payload の <code>"キー": 値</code> の1行が、1つの claim にあたる。`, answer: true,
      explain: `claim は<b class="key">名前と値のペア</b>で、payload の JSON の1行が 1 claim である。`, lesson: 'c03-l01' },
    { id: 'c03-ox-02', text: `claim は仕様で名前がすべて決まっており、自分で新しい claim を作ることはできない。`, answer: false,
      explain: `自分で作る<b class="key">カスタム claim</b> (<code>dept</code>, <code>tenant</code> など) があり、Mapper で作る。`, lesson: 'c03-l01' },
    { id: 'c03-ox-03', text: `アクセストークンの宛先は Client 自身であり、ID トークンの宛先は API (Resource Server) である。`, answer: false,
      explain: `逆である。Access Token の宛先は <b class="key">API</b>、ID Token の宛先は <b class="key">Client 自身</b>である。`, lesson: 'c03-l01' },
    { id: 'c03-ox-04', text: `Refresh Token の宛先は Keycloak 自身で、aud には realm の issuer URL が入る。`, answer: true,
      explain: `Refresh Token は Keycloak に出して再発行してもらうためのものなので、宛先は <b class="key">Keycloak 自身</b> (aud = realm の issuer URL) である。`, lesson: 'c03-l01' },
    { id: 'c03-ox-05', text: `JWT は、header.payload.signature を Base64URL でエンコードして <code>.</code> でつないだ形をしている。`, answer: true,
      explain: `JWT は3つの部分を Base64URL でエンコードし、<code>.</code> でつないだ形である。`, lesson: 'c03-l01' },
    { id: 'c03-ox-06', text: `JWT header の <code>kid</code> は、トークンの発行先クライアントを示す。`, answer: false,
      explain: `<code>kid</code> は<b class="key">どの鍵で署名したか</b>を示す。発行先クライアントではない。API は JWKS から同じ kid の公開鍵を探して検証する。`, lesson: 'c03-l01' },
    { id: 'c03-ox-07', text: `payload 例の <code>resource_access</code> は、client ごとに Client Role の配列を持つ形になっている。`, answer: true,
      explain: `<code>resource_access</code> の下に <code>backend-api</code> や <code>account</code> など client ごとの <code>roles</code> が入る。Realm Role は <code>realm_access</code> である。`, lesson: 'c03-l02' },
    { id: 'c03-ox-08', text: `ユーザーを自分の DB と紐付けるキーには、変わりにくい username を使うのがよい。`, answer: false,
      explain: `email や username は<b class="key">変わりうる</b>。DB の紐付けキーには、UUID である <b class="key">sub</b> を使う。`, lesson: 'c03-l02' },
    { id: 'c03-ox-09', text: `同じ Keycloak でも、アクセスするホスト名が <code>localhost:8080</code> と <code>keycloak:8080</code> で異なると、iss の値が変わりうる。`, answer: true,
      explain: `iss はアクセス元に応じて変わりうるため、<b class="key">Frontend URL / KC_HOSTNAME を固定</b>して揃える。API は iss が信頼する値と完全一致するかを検証する。`, lesson: 'c03-l02' },
    { id: 'c03-ox-10', text: `SPA の <code>frontend-spa</code> が API の <code>backend-api</code> 向けにトークンを取得したとき、aud は <code>frontend-spa</code>、azp は <code>backend-api</code> になる。`, answer: false,
      explain: `逆である。aud (宛先) = <code>backend-api</code>、azp (要求者) = <code>frontend-spa</code> となる。`, lesson: 'c03-l02' },
    { id: 'c03-ox-11', text: `API は、受け取ったトークンの aud に自分の名前が入っていなければ拒否する。`, answer: true,
      explain: `aud は「誰宛か」を表す。<b class="key">自分宛でないトークンは拒否</b>することで、別 API へのトークンの使い回しを防ぐ。`, lesson: 'c03-l02' },
    { id: 'c03-ox-12', text: `nbf は有効期限を表し、exp は「この時刻より前は無効」を表す。`, answer: false,
      explain: `逆である。<b class="key">exp</b> が有効期限、<b class="key">nbf</b> (Not Before) が「この時刻より前は無効」を表す。`, lesson: 'c03-l02' },
    { id: 'c03-ox-13', text: `jti はトークン固有の ID で、リプレイ検知や失効管理に使える。`, answer: true,
      explain: `<b class="key">jti</b> (JWT ID) はトークンごとに固有で、同じトークンの再利用の検知や失効管理に使える。`, lesson: 'c03-l02' },
    { id: 'c03-ox-14', text: `auth_time は、トークンが発行された時刻を表す claim である。`, answer: false,
      explain: `トークンの発行時刻は <b class="key">iat</b> である。<b class="key">auth_time</b> は、ユーザーが実際に認証した時刻を表す。`, lesson: 'c03-l02' },
    { id: 'c03-ox-15', text: `groups claim は、Group Membership Mapper を作ったときにトークンに載る。`, answer: true,
      explain: `<code>groups</code> は Keycloak 独自 claim の1つで、<b class="key">Group Membership Mapper</b> を作ったときに載る。`, lesson: 'c03-l03' },
    { id: 'c03-ox-16', text: `動作確認のために、本番環境の実トークンを jwt.io に貼って decode するのがよい。`, answer: false,
      explain: `jwt.io は decode に便利だが、<b class="key">本番トークンは貼らない</b>。トークンの内容を外部サイトに渡してしまうためである。`, lesson: 'c03-l03' }
  ],
  mc: [
    { id: 'c03-mc-01', stem: `【組合せ型】トークンの種類と宛先に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `ID Token の宛先は API (Resource Server) であり、API を呼ぶ通行証として使う。` },
        { label: 'B', text: `Access Token の宛先は API であり、ID Token の宛先は Client 自身である。` },
        { label: 'C', text: `Refresh Token の宛先は Keycloak 自身である。` },
        { label: 'D', text: `Offline Token は、有効期限が極端に短い Refresh Token である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× ID Token の宛先は Client 自身で、「誰がログインしたか」を伝えるためのものである。API を呼ぶ通行証は Access Token である。`,
        `B：○ Access Token は API 宛、ID Token は Client 自身宛である。`,
        `C：○ Refresh Token は再発行のために Keycloak に出すもので、宛先は Keycloak 自身である。`,
        `D：× Offline Token は<b class="key">長期</b>の Refresh Token である (scope=offline_access)。`
      ],
      tip: `トークンは「誰に見せるか」で区別する。API には Access、アプリ自身には ID、Keycloak には Refresh。` },
    { id: 'c03-mc-02', stem: `【正誤選択型】aud と azp に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `aud と azp は同じ意味で、どちらもトークンの宛先を表す。`,
        `API は、aud に自分の名前が無くてもトークンを受け入れる。`,
        `Keycloak のデフォルトでは、Access Token の aud に API の名前が自動で入る。`,
        `aud は「このトークンは誰宛か」を表し、azp は「トークンを要求したクライアント」を表す。`,
        `ID Token の aud は、発行先の realm 名である。`
      ], answer: 4,
      explain: [
        `1：× aud は宛先、azp は要求者で別物である。`,
        `2：× API は自分の名前が aud に入っていなければ拒否する。`,
        `3：× デフォルトでは account しか入らないことが多く、API 名を入れるには Audience Mapper か Audience Resolve が必要である。`,
        `4：○ aud = 宛先、azp = 要求者である。`,
        `5：× ID Token の aud は発行先の client_id である。`
      ],
      tip: `aud は「宛先」、azp は「依頼者」。手紙の宛名と差出人の関係に置き換えて区別する。` },
    { id: 'c03-mc-03', stem: `【組合せ型】iss と sub に関する次の記述のうち、誤っているものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `sub は UUID であり、DB の紐付けキーに適している。` },
        { label: 'B', text: `iss は、自分が信頼する issuer と完全一致するかを検証する。` },
        { label: 'C', text: `username は変わりにくいので、sub の代わりに DB の紐付けキーにしてよい。` },
        { label: 'D', text: `Docker の内外でホスト名が変わっても iss は常に同じ値になるので、設定は不要である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：○ (記述は正しい) sub は UUID でユーザーを一意に示す。`,
        `B：○ (記述は正しい) iss は信頼する issuer と完全一致するかを検証する。`,
        `C：× (誤り) email や username は変わりうる。紐付けキーには sub を使う。`,
        `D：× (誤り) localhost:8080 と keycloak:8080 などで iss は変わる。Frontend URL / KC_HOSTNAME を固定して揃える。`
      ],
      tip: `変わらない ID は sub、変わりうるのは username や email。iss はホスト名が変わると変わる。` },
    { id: 'c03-mc-04', stem: `【正誤選択型】標準 claim に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        `exp は UNIX 秒の有効期限で、デフォルトの Access Token は 5 分である。`,
        `jti は、トークンがどのクライアント向けかを示す claim である。`,
        `nonce は、認可リクエストで送った値がそのまま ID Token に返り、リプレイ防止に使われる。`,
        `acr は認証強度を表し、MFA 済みかどうかなどを示す。`,
        `sid は、Keycloak の SSO セッションを表す ID である。`
      ], answer: 2,
      explain: [
        `1：○ exp は有効期限で、デフォルトの Access Token は 5 分である。`,
        `2：× jti はトークン固有の ID で、リプレイ検知や失効管理に使う。クライアント向けかどうかは aud / azp で示す。`,
        `3：○ nonce は ID Token のリプレイ防止に使う。`,
        `4：○ acr は認証強度 (Level of Authentication) を表す。`,
        `5：○ sid は Keycloak の SSO セッション ID である。`
      ],
      tip: `jti は「トークン1枚ごとのシリアル番号」。宛先を表す aud とは役割が違う。` },
    { id: 'c03-mc-05', stem: `【組合せ型】claim の種類に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `claim は仕様で定められた名前のものだけが使え、dept のような独自の claim は作れない。` },
        { label: 'B', text: `realm_access は Keycloak 独自の claim で、Realm Role が入る。` },
        { label: 'C', text: `resource_access.&lt;client&gt;.roles には、Realm Role が入る。` },
        { label: 'D', text: `カスタム claim は、Mapper で作る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× dept や tenant のようなカスタム claim を自分で作れる。`,
        `B：○ realm_access.roles が Realm Role である。`,
        `C：× resource_access.&lt;client&gt;.roles には、その Client の Client Role が入る。`,
        `D：○ カスタム claim は Mapper で作る (第4章)。`
      ],
      tip: `realm_access は「realm 全体のロール」、resource_access は「client ごとのロール」と名前から対応づける。` },
    { id: 'c03-mc-06', stem: `【正誤選択型】JWT の構造と検証に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `JWT の header の kid は、トークンの発行先クライアントを示す。`,
        `JWT は、payload だけを Base64URL でエンコードしたものである。`,
        `JWT は header.payload.signature を . でつないだ形で、kid に対応する公開鍵を JWKS から探して署名を検証する。`,
        `Refresh Token の typ は Bearer である。`,
        `ID Token の typ は Refresh である。`
      ], answer: 3,
      explain: [
        `1：× kid は、どの鍵で署名したかを示す。`,
        `2：× header.payload.signature の3つの部分をそれぞれ Base64URL でエンコードして . でつなぐ。`,
        `3：○ kid に対応する公開鍵を JWKS から探して署名を検証する。`,
        `4：× Refresh Token の typ は Refresh である。Bearer は Access Token である。`,
        `5：× ID Token の typ は ID である。`
      ],
      tip: `kid は「鍵の名札」。名札が一致する公開鍵を JWKS から探す、という流れで覚える。` },
    { id: 'c03-mc-07', stem: `【組合せ型】トークンの読み方に関する次の記述のうち、誤っているものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `JWT の payload は暗号化されているので、decode しても読めない。` },
        { label: 'B', text: `jwt.io には、本番トークンを貼って動作確認してよい。` },
        { label: 'C', text: `CLI では payload 部分を base64 -d して jq で整形できるが、padding に注意が必要である。` },
        { label: 'D', text: `groups claim は、Group Membership Mapper を作ったときに載る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：× (誤り) payload は Base64URL でエンコードされているだけで、decode すれば読める。jwt.io や base64 -d で読めるのはそのためである。`,
        `B：× (誤り) 本番トークンは jwt.io に貼らない。`,
        `C：○ (記述は正しい) base64 -d と jq で読める。padding に注意する。`,
        `D：○ (記述は正しい) groups は Group Membership Mapper を作ったときに載る。`
      ],
      tip: `JWT は「署名されているが中身は読める」。だから本番トークンは外部サイトに貼らない。` },
    { id: 'c03-mc-08', stem: `【正誤選択型】claim とトークンに関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `claim は、ユーザーのパスワードそのものをトークンに入れる仕組みを指す。`,
        `Mapper で作れるのは標準 claim だけで、カスタム claim は作れない。`,
        `client_credentials で得たトークンの sub は、client_id の文字列そのものである。`,
        `ID Token は、API を呼ぶための通行証であり、宛先は API である。`,
        `client_credentials で得たトークンの sub には、service account ユーザーの UUID が入る。`
      ], answer: 5,
      explain: [
        `1：× claim は、トークンの中に入っている名前と値のペア (1つの情報) である。`,
        `2：× カスタム claim も Mapper で作れる。`,
        `3：× client_credentials の場合の sub は、service account ユーザーの UUID である。`,
        `4：× 宛先が API で通行証として使うのは Access Token である。ID Token の宛先は Client 自身である。`,
        `5：○ client_credentials の場合、sub は service account ユーザーの UUID である。`
      ],
      tip: `Client Credentials でも sub は UUID。裏側に「service account ユーザー」がいると考える。` }
  ]
});
DATA.chapters.push({
  no: 4, title: `Client Scope と Mapper`,
  lessons: [
    { id: 'c04-l01', title: `3部品の関係・Client Scope・Default/Optional`, pages: [
      { id: 'c04-l01-p01', title: `Mapper・Client Scope・Client の3つの部品`,
        html: `<h4>この章の目的</h4><p>この章の仕組みは、「<b class="key">どのユーザー情報を、どの名前で、どのトークンに入れるか</b>」を決めるためのものである。</p><h4>部品は3つ</h4><ul><li><b class="key">Mapper</b> = 1個の claim を作る<b class="key">最小部品</b>。例: 「ユーザーの email を <code>email</code> claim にする」</li><li><b class="key">Client Scope</b> = Mapper を何個かまとめた<b class="key">セット</b>。例: <code>email</code> スコープ = email と email_verified の Mapper 2個</li><li><b class="key">Client</b> = どの Client Scope を使うかを選ぶ<b class="key">利用者</b></li></ul><h4>なぜ分けているのか</h4><p>同じ「email を載せる」設定を、クライアントごとに作り直さず<b class="key">使い回す</b>ためである。Mapper を Client Scope にまとめておけば、各 Client はそのスコープを選ぶだけで済む。</p>`,
        oxIds: ['c04-ox-01', 'c04-ox-02'] },
      { id: 'c04-l01-p02', title: `図で見る3部品の関係`,
        html: `<h4>構成図</h4><pre>Client (frontend-spa)
  └─ 使う Client Scope を選ぶ
       ├─ profile  ── Mapper: username → preferred_username
       │              Mapper: firstName → given_name ...
       ├─ email    ── Mapper: email → email
       │              Mapper: emailVerified → email_verified
       └─ roles    ── Mapper: ロール → realm_access / resource_access
                                 ↓
                    トークンの claim (JSON) になる</pre><h4>図の読み方</h4><ul><li>一番上の <b class="key">Client</b> が、使う Client Scope を選ぶ</li><li>各 <b class="key">Client Scope</b> の下に、その中の <b class="key">Mapper</b> が並ぶ。矢印の左が元データ、右が作られる claim</li><li>最終的に、Mapper が作った claim がトークンの JSON になる</li></ul><span class="trap">「claim を作る」のは Mapper、「Mapper をまとめる」のが Client Scope、「Client Scope を選ぶ」のが Client。主語を取り違えない。</span>`,
        oxIds: ['c04-ox-03'] },
      { id: 'c04-l01-p03', title: `Client Scope とは`,
        html: `<h4>定義</h4><p><b class="key">Client Scope</b> は、「トークンに載せる情報のひとまとまり」に名前を付けたものである。次のタブを持つ。</p><ul><li><b class="key">Mappers</b>: どの claim を作るか</li><li><b class="key">Scope</b>: そのスコープを使うとき、トークンに載せてよい<b class="key">ロール</b>の範囲 (Role scope mapping)</li><li><b class="key">Settings</b>: 名前、説明、「Include in token scope」(トークンの <code>scope</code> claim に名前を載せるか) など</li></ul><h4>「scope」という言葉は2つの意味がある</h4><ul><li>OAuth の <code>scope</code> パラメータ = クライアントがリクエストで指定する文字列 (<code>scope=openid profile email</code>)</li><li>Keycloak の Client Scope = それに対応する設定の実体 (名前が <code>profile</code> の Client Scope)</li></ul><p>つまり、リクエストの <code>scope=profile</code> が、Keycloak 上の <code>profile</code> という名前の Client Scope を呼び出す。</p><span class="trap">同じ「scope」でも、リクエストの文字列と、Keycloak 上の設定の実体は別のものである。名前が一致することで結び付く。</span>`,
        oxIds: ['c04-ox-04', 'c04-ox-05'] },
      { id: 'c04-l01-p04', title: `Default Scope と Optional Scope`,
        html: `<h4>Client への紐付け方は2種類</h4><table><tr><th>種類</th><th>適用されるとき</th><th>例</th></tr><tr><td><b class="key">Default Scope</b></td><td>リクエストの <code>scope</code> に書かなくても<b class="key">常に適用</b></td><td><code>profile</code>, <code>email</code>, <code>roles</code> は通常 Default</td></tr><tr><td><b class="key">Optional Scope</b></td><td>リクエストの <code>scope=</code> に<b class="key">名前を書いたときだけ</b>適用</td><td><code>phone</code> を Optional にしておき、<code>scope=openid phone</code> と要求したときだけ <code>phone_number</code> が載る</td></tr></table><h4>使い分けの考え方</h4><ul><li>常に必要な情報 → Default</li><li>機微な情報で、必要なときだけ欲しい → Optional (最小限の情報だけ渡す)</li></ul><p>設定場所は Clients → 対象 → Client scopes タブである。</p><span class="trap">Optional は「使えない」という意味ではない。リクエストで名前を指定すれば使える。</span>`,
        oxIds: ['c04-ox-06', 'c04-ox-07'] }
    ] },
    { id: 'c04-l02', title: `標準 Client Scope・Dedicated`, pages: [
      { id: 'c04-l02-p01', title: `標準 Client Scope (1): openid・profile・email・roles`,
        html: `<h4>「標準」とは</h4><p>realm を作ると<b class="key">最初から入っている</b>スコープである。OIDC の仕様で決まっている名前に対応する。</p><ul><li><b class="key"><code>openid</code></b> (必須級): 「OIDC として動かす」宣言。<b class="key">これが無いと ID Token が返らない</b>。Keycloak では <code>scope</code> 文字列に書く特別な値で、実体の Client Scope としては見えないことが多い</li><li><b class="key"><code>profile</code></b>: 名前系の情報。<code>name</code>, <code>given_name</code>, <code>family_name</code>, <code>preferred_username</code>, <code>nickname</code>, <code>locale</code> など</li><li><b class="key"><code>email</code></b>: <code>email</code> (アドレス) と <code>email_verified</code> (確認済みか true / false)</li><li><b class="key"><code>roles</code></b>: ユーザーのロールを載せる。<code>realm_access.roles</code> と <code>resource_access.&lt;client&gt;.roles</code>。<b class="key">Audience Resolve</b> (ロールを持つ client を <code>aud</code> に自動追加) もここに入っている</li></ul><span class="trap"><code>openid</code> は「OIDC として動かす」ための宣言であり、Mapper の入った通常の Client Scope として見えるとは限らない。</span>`,
        oxIds: ['c04-ox-08', 'c04-ox-09'] },
      { id: 'c04-l02-p02', title: `標準 Client Scope (2): そのほかのスコープ`,
        html: `<h4>残りの標準スコープ</h4><table><tr><th>スコープ</th><th>役割</th></tr><tr><td><b class="key"><code>web-origins</code></b></td><td>Client の Web Origins 設定を <code>allowed-origins</code> claim に載せる (CORS 用)</td></tr><tr><td><b class="key"><code>acr</code></b></td><td>認証の強度 (MFA したか等) を <code>acr</code> claim に載せる</td></tr><tr><td><b class="key"><code>basic</code></b> (v25+)</td><td>全トークンに必要な基本 claim (<code>sub</code>, <code>auth_time</code>) を載せる</td></tr><tr><td><b class="key"><code>offline_access</code></b></td><td>「長期間使える Refresh Token (Offline Token) が欲しい」というリクエスト用</td></tr><tr><td><code>address</code></td><td>住所 (<code>address</code> claim)</td></tr><tr><td><code>phone</code></td><td>電話番号 (<code>phone_number</code>, <code>phone_number_verified</code>)</td></tr><tr><td><code>microprofile-jwt</code></td><td>MicroProfile JWT 仕様向けの claim (<code>groups</code>, <code>upn</code>)</td></tr><tr><td><code>service_account</code></td><td>Client Credentials のとき Service Account 用の claim を足す</td></tr><tr><td><code>organization</code> (v26)</td><td>所属 Organization を載せる</td></tr></table><h4>自分でも作れる</h4><p>例: <code>company-info</code> という Client Scope を作り、Mapper で <code>department</code> を入れる。</p>`,
        oxIds: ['c04-ox-10', 'c04-ox-11'] },
      { id: 'c04-l02-p03', title: `Dedicated Scope (専用スコープ)`,
        html: `<h4>Dedicated Scope とは</h4><p><code>&lt;client名&gt;-dedicated</code> という名前で、各 Client に<b class="key">自動で1つ</b>ある、その<b class="key">クライアント専用</b>の Client Scope である。</p><ul><li>他の Client と<b class="key">共有しない</b> Mapper を置く場所。例: このクライアント専用の Audience</li><li>場所: Clients → 対象 → Client scopes → <code>xxx-dedicated</code></li></ul><h4>通常の Client Scope との使い分け</h4><p>複数の Client で使い回したい設定は、通常の Client Scope にまとめる。その Client だけで使う設定は Dedicated Scope に置く。</p><span class="trap">Dedicated Scope は「共有するためのもの」ではなく、その Client だけのものである。</span>`,
        oxIds: ['c04-ox-12'] }
    ] },
    { id: 'c04-l03', title: `Mapper とは・種類`, pages: [
      { id: 'c04-l03-p01', title: `Mapper とは`,
        html: `<h4>定義</h4><p><b class="key">Mapper</b> は、<b class="key">ユーザー情報やロール等の元データを読み取り、トークンの claim に変換する部品</b>である。1つの Mapper が 1つ (または1系統) の claim を作る。</p><h4>例</h4><ul><li>元データ: ユーザー属性 <code>department = sales</code></li><li>Mapper: User Attribute Mapper (Token Claim Name = <code>dept</code>)</li><li>結果: トークンに <code>"dept": "sales"</code></li></ul><h4>正式名称と追加方法</h4><ul><li>正式名称は <b class="key">Protocol Mapper</b>。OIDC / SAML ごとに種類が違う (この章では OIDC を扱う)</li><li>追加方法: Client scopes → 対象 → Mappers → Configure a new mapper (または By configuration)</li></ul>`,
        oxIds: ['c04-ox-13'] },
      { id: 'c04-l03-p02', title: `User Attribute と User Property`,
        html: `<h4>User Attribute</h4><ul><li>何をする: ユーザーに付けた<b class="key">独自属性</b>を claim にする</li><li>使う場面: 部署、社員番号、テナント ID など Keycloak 標準にない項目</li><li>設定例: User Attribute=<code>department</code> / Token Claim Name=<code>dept</code> / Claim JSON Type=<code>String</code></li><li>結果: <code>"dept": "sales"</code></li></ul><h4>User Property</h4><ul><li>何をする: ユーザーの<b class="key">標準項目</b> (username, email, firstName, lastName など) を claim にする</li><li>設定例: Property=<code>username</code> / Token Claim Name=<code>preferred_username</code></li></ul><h4>違い</h4><p>Property は Keycloak 組み込みの項目、Attribute は管理者が自由に追加した項目を読む。</p><span class="trap">どちらも「ユーザー情報を claim にする」が、読む元データが違う。標準項目なら Property、独自に足した項目なら Attribute。</span>`,
        oxIds: ['c04-ox-14', 'c04-ox-15'] },
      { id: 'c04-l03-p03', title: `ロールの Mapper: User Realm Role と User Client Role`,
        html: `<h4>User Realm Role</h4><ul><li>何をする: ユーザーの <b class="key">Realm Role</b> を claim にする。既定は <code>realm_access.roles</code></li><li>設定例: Token Claim Name=<code>realm_access.roles</code> / Multivalued=ON</li><li>結果: <code>"realm_access": {"roles": ["user","admin"]}</code></li></ul><h4>User Client Role</h4><ul><li>何をする: 特定 Client の <b class="key">Client Role</b> を claim にする。既定は <code>resource_access.&lt;client&gt;.roles</code></li><li>設定例: Client ID=<code>backend-api</code> / Token Claim Name=<code>roles</code></li><li>結果: <code>"roles": ["read","write"]</code> のように<b class="key">フラットな名前</b>にもできる (API が読みやすい)</li></ul><span class="trap">Realm Role と Client Role は出力先の既定が違う。Realm Role は <code>realm_access</code>、Client Role は <code>resource_access</code> の下である。</span>`,
        oxIds: ['c04-ox-16', 'c04-ox-17'] },
      { id: 'c04-l03-p04', title: `Audience・Audience Resolve・Group Membership`,
        html: `<h4>Audience</h4><ul><li>何をする: 指定した client_id を <code>aud</code> に<b class="key">固定で追加</b></li><li>設定例: Included Client Audience=<code>backend-api</code> / Add to access token=ON</li><li>結果: <code>"aud": ["backend-api"]</code></li><li>使う場面: 「API は aud に自分の名前が無いと拒否する」とき</li></ul><h4>Audience Resolve</h4><ul><li>何をする: ユーザーが<b class="key">ロールを持っている Client を自動で</b> <code>aud</code> に追加</li><li>設定不要 (<code>roles</code> スコープに最初から入っている)</li><li>Audience との違い: <b class="key">固定</b>か (Audience)、ロールに応じて<b class="key">自動</b>か (Resolve)</li></ul><h4>Group Membership</h4><ul><li>何をする: ユーザーの所属<b class="key">グループ名</b>を claim にする</li><li>設定例: Token Claim Name=<code>groups</code> / Full group path=OFF</li><li>結果: OFF → <code>["dev","admin"]</code> / ON → <code>["/company/dev","/admin"]</code></li></ul>`,
        oxIds: ['c04-ox-18', 'c04-ox-19'] },
      { id: 'c04-l03-p05', title: `そのほかの Mapper`,
        html: `<h4>用途の限られた Mapper</h4><table><tr><th>Mapper</th><th>何をするか</th></tr><tr><td><b class="key">Hardcoded claim</b></td><td><b class="key">誰でも同じ固定値</b>を claim に入れる。設定例: Token Claim Name=<code>tenant</code> / Claim value=<code>acme</code> → <code>"tenant": "acme"</code>。クライアントごとに固定のラベルを付けたいときに使う</td></tr><tr><td><b class="key">Hardcoded role</b></td><td>ロールを<b class="key">強制的にトークンに追加</b>する (ユーザーへの付与なしで)</td></tr><tr><td><b class="key">Role Name Mapper</b></td><td>ロールの名前を別名に置換する (例: <code>admin</code> → <code>administrator</code>)</td></tr><tr><td><b class="key">Full name</b></td><td>firstName + lastName を合成して <code>name</code> claim にする</td></tr><tr><td><b class="key">Script Mapper</b></td><td>JavaScript で自由に claim を作る。セキュリティ上、既定で無効・非推奨</td></tr><tr><td><b class="key">SHA-256 Pairwise sub</b></td><td><code>sub</code> をクライアントごとに別の値にする (クライアント間でユーザーを突合できなくする、プライバシー用)</td></tr></table><span class="trap">Hardcoded claim は「ユーザーごとに違う値」ではなく「誰でも同じ値」。ユーザーごとに違う値は User Attribute などで作る。</span>`,
        oxIds: ['c04-ox-20', 'c04-ox-21'] }
    ] },
    { id: 'c04-l04', title: `Mapper 設定項目・具体例・Full Scope Allowed・Lightweight`, pages: [
      { id: 'c04-l04-p01', title: `Mapper の設定項目 (1): Name・Type・Token Claim Name`,
        html: `<h4>画面の各項目の意味</h4><ul><li><b class="key">Name</b>: 管理画面での表示名。<b class="key">トークンには影響しない</b>。分かりやすい名前でよい</li><li><b class="key">Mapper Type</b>: User Attribute などの種類。作成時に決める</li><li><b class="key">User Attribute / Property</b> (Mapper 種別による): <b class="key">元データ</b>側の指定。「ユーザーのどの項目を読むか」</li><li><b class="key">Token Claim Name</b>: <b class="key">トークン内に出力する claim の名前</b>。最重要項目</li></ul><h4>Token Claim Name の書き方</h4><p>例: <code>dept</code> と指定すると <code>"dept": "sales"</code> になる。<code>.</code> を使うとネストする。</p><pre>Token Claim Name = org.dept
→ {"org": {"dept": "sales"}}</pre><p>名前に <code>.</code> を含めたいときは <code>a\\.b</code> のようにエスケープする。</p><span class="trap">Name は管理画面の表示名、Token Claim Name はトークン内の claim 名。名前が似ているが、トークンに出るのは Token Claim Name だけである。</span>`,
        oxIds: ['c04-ox-22'] },
      { id: 'c04-l04-p02', title: `Mapper の設定項目 (2): 型と配列`,
        html: `<h4>Claim JSON Type</h4><p>claim の<b class="key">値の型</b>を指定する。</p><table><tr><th>指定</th><th>出力</th></tr><tr><td><code>String</code></td><td>文字列 <code>"1"</code></td></tr><tr><td><code>int</code>, <code>long</code></td><td>数値 <code>1</code></td></tr><tr><td><code>boolean</code></td><td><code>true</code></td></tr><tr><td><code>JSON</code></td><td>オブジェクトや配列</td></tr></table><span class="trap">型を間違えると API 側のパースで失敗する (数値なのに String など)。</span><h4>Multivalued</h4><ul><li>ON = 値が複数の<b class="key">配列</b> (<code>["a","b"]</code>)、OFF = 単一値 (<code>"a"</code>)</li><li>ロールやグループは ON にする</li></ul><h4>Aggregate attribute values</h4><p>複数の値 (グループやロールに同名属性がある場合) を<b class="key">まとめて配列にする</b>。</p>`,
        oxIds: ['c04-ox-23'] },
      { id: 'c04-l04-p03', title: `Add to ... の設定: どのトークンに載せるか`,
        html: `<h4>載せ先を決めるチェック</h4><table><tr><th>設定</th><th>ON にすると</th></tr><tr><td><b class="key">Add to ID token</b></td><td>claim が <b class="key">ID Token</b> に入る (アプリがユーザーを知るため)</td></tr><tr><td><b class="key">Add to access token</b></td><td>claim が <b class="key">Access Token</b> に入る (API が認可判断に使う)</td></tr><tr><td><b class="key">Add to lightweight access token</b></td><td><b class="key">軽量版 Access Token</b> にも入る (v24+。通常は OFF にしてトークンを小さく保つ)</td></tr><tr><td><b class="key">Add to userinfo</b></td><td><code>/userinfo</code> の返り値に入る</td></tr><tr><td><b class="key">Add to token introspection</b></td><td><code>/token/introspect</code> の返り値に入る</td></tr><tr><td>Add to access token response (一部の Mapper)</td><td>トークンレスポンス JSON 本体にも出る</td></tr></table><h4>ポイント</h4><ul><li>「どのトークンに載るか」は、上の <b class="key">Add to ...</b> のチェックで決まる</li><li>claim が出ないとき、最初に疑うのは <b class="key">Add to access token が OFF</b> のこと</li></ul>`,
        oxIds: ['c04-ox-24'] },
      { id: 'c04-l04-p04', title: `具体例: API が aud=backend-api を要求する`,
        html: `<h4>症状</h4><p>API が 401 を返す。トークンの <code>aud</code> が <code>["account"]</code> で、<code>backend-api</code> が入っていない。</p><h4>手順 A: Audience Mapper で固定</h4><ul><li>Clients → <code>frontend-spa</code> → Client scopes → <code>frontend-spa-dedicated</code> → Configure a new mapper → Audience</li><li>Included Client Audience=<code>backend-api</code>、Add to access token=ON</li></ul><h4>手順 B: ロールで自動</h4><ul><li><code>backend-api</code> に Client Role <code>read</code> を作ってユーザーに付与</li><li><code>roles</code> スコープの <b class="key">Audience Resolve</b> が働き、<code>aud</code> に追加される</li><li><b class="key">Full Scope Allowed</b> が OFF の場合は、Client の Scope タブでそのロールを許可する</li></ul><span class="trap">手順 A は固定で追加、手順 B はユーザーがロールを持っていることが前提の自動追加。ロールを付与していなければ B は働かない。</span>`,
        oxIds: ['c04-ox-25', 'c04-ox-26'] },
      { id: 'c04-l04-p05', title: `Full Scope Allowed と Lightweight Access Token`,
        html: `<h4>Full Scope Allowed</h4><p>意味は「<b class="key">ユーザーが持つ全ロールをトークンに載せるか</b>」である。</p><ul><li><b class="key">ON (既定)</b>: 全部載る。簡単だが、トークンが大きく、権限が広い</li><li><b class="key">OFF</b>: Client Scope / Client の Scope タブで<b class="key">許可したロールだけ</b>載る (最小権限)</li></ul><h4>Lightweight Access Token</h4><ul><li>Access Token を小さくし、詳細な claim は userinfo / introspection で取る方式 (v24+)</li><li>Client の <b class="key">Advanced タブ</b>で有効化する</li><li>Mapper の「Add to lightweight access token」で、載せる claim を選ぶ</li></ul><span class="trap">Full Scope Allowed は ON が既定で簡単だが、権限が広くなる。最小権限にしたいときは OFF にして、必要なロールだけ許可する。</span>`,
        oxIds: ['c04-ox-27', 'c04-ox-28'] }
    ] }
  ],
  ox: [
    { id: 'c04-ox-01', text: `Mapper は 1 個の claim を作る最小部品で、Client Scope は Mapper を何個かまとめたセットである。`, answer: true,
      explain: `Mapper が<b class="key">最小部品</b>、Client Scope が Mapper の<b class="key">セット</b>、Client がどのスコープを使うかを選ぶ<b class="key">利用者</b>である。`, lesson: 'c04-l01' },
    { id: 'c04-ox-02', text: `Mapper を Client Scope にまとめるのは、クライアントごとに同じ設定を個別に作り直すためである。`, answer: false,
      explain: `まとめる目的は逆で、同じ設定をクライアントごとに作り直さず<b class="key">使い回す</b>ためである。`, lesson: 'c04-l01' },
    { id: 'c04-ox-03', text: `構成図では、<code>email</code> スコープの Mapper が、ユーザーの email を <code>email</code> claim に、emailVerified を <code>email_verified</code> claim にする。`, answer: true,
      explain: `<code>email</code> スコープには Mapper が2つあり、それぞれ email → <code>email</code>、emailVerified → <code>email_verified</code> に変換する。Mapper は元データを claim に変換する部品である。`, lesson: 'c04-l01' },
    { id: 'c04-ox-04', text: `リクエストで <code>scope=profile</code> と指定しても、Keycloak 上の <code>profile</code> という Client Scope とは無関係である。`, answer: false,
      explain: `リクエストの <code>scope=profile</code> が、Keycloak 上の <code>profile</code> という名前の Client Scope を<b class="key">呼び出す</b>。`, lesson: 'c04-l01' },
    { id: 'c04-ox-05', text: `Client Scope の Scope タブでは、そのスコープを使うときにトークンに載せてよいロールの範囲を決める。`, answer: true,
      explain: `Scope タブは<b class="key">ロールの範囲</b> (Role scope mapping) を決める。どの claim を作るかを決めるのは Mappers タブである。`, lesson: 'c04-l01' },
    { id: 'c04-ox-06', text: `Optional Scope は、リクエストの <code>scope</code> に書かなくても常に適用される。`, answer: false,
      explain: `Optional は、リクエストの <code>scope=</code> に<b class="key">名前を書いたときだけ</b>適用される。常に適用されるのは Default Scope である。`, lesson: 'c04-l01' },
    { id: 'c04-ox-07', text: `<code>phone</code> を Optional Scope にしておくと、<code>scope=openid phone</code> と要求したときだけ <code>phone_number</code> が載る。`, answer: true,
      explain: `Optional は要求したときだけ適用されるため、機微な情報を必要なときだけ渡せる。`, lesson: 'c04-l01' },
    { id: 'c04-ox-08', text: `<code>scope</code> に <code>openid</code> を含めないと、ID Token は返らない。`, answer: true,
      explain: `<code>openid</code> は「OIDC として動かす」宣言で、<b class="key">これが無いと ID Token が返らない</b>。`, lesson: 'c04-l02' },
    { id: 'c04-ox-09', text: `Audience Resolve は、<code>web-origins</code> スコープに最初から入っている。`, answer: false,
      explain: `Audience Resolve が最初から入っているのは <b class="key"><code>roles</code></b> スコープである。<code>web-origins</code> は Web Origins 設定を <code>allowed-origins</code> claim に載せる。`, lesson: 'c04-l02' },
    { id: 'c04-ox-10', text: `<code>web-origins</code> スコープは、Client の Web Origins 設定を <code>allowed-origins</code> claim に載せる。`, answer: true,
      explain: `<code>web-origins</code> は Web Origins の設定値を <code>allowed-origins</code> claim に載せる (CORS 用) スコープである。`, lesson: 'c04-l02' },
    { id: 'c04-ox-11', text: `<code>offline_access</code> スコープは、ID Token を返すために必要な宣言である。`, answer: false,
      explain: `ID Token のために必要なのは <code>openid</code> である。<code>offline_access</code> は、<b class="key">長期間使える Refresh Token (Offline Token)</b> を求めるリクエスト用である。`, lesson: 'c04-l02' },
    { id: 'c04-ox-12', text: `Dedicated Scope は、複数の Client で共有するための Mapper を置く場所である。`, answer: false,
      explain: `Dedicated Scope は各 Client に自動で1つある<b class="key">その Client 専用</b>のスコープで、他の Client と共有しない Mapper を置く。`, lesson: 'c04-l02' },
    { id: 'c04-ox-13', text: `User Attribute Mapper で Token Claim Name を <code>dept</code> にすると、ユーザー属性 <code>department = sales</code> は <code>"dept": "sales"</code> としてトークンに載る。`, answer: true,
      explain: `Mapper は元データを読み取って claim に変換する。元データの属性名 (<code>department</code>) と出力される claim 名 (<code>dept</code>) は別に指定できる。`, lesson: 'c04-l03' },
    { id: 'c04-ox-14', text: `username や email などの標準項目を claim にするには、User Attribute Mapper を使う。`, answer: false,
      explain: `標準項目 (username, email, firstName, lastName など) を claim にするのは <b class="key">User Property</b> である。User Attribute は管理者が追加した独自属性用である。`, lesson: 'c04-l03' },
    { id: 'c04-ox-15', text: `部署や社員番号のように Keycloak 標準にない項目を claim にしたいときは、User Attribute Mapper を使う。`, answer: true,
      explain: `標準にない独自の項目は<b class="key">ユーザー属性</b>として追加し、User Attribute Mapper で claim にする。`, lesson: 'c04-l03' },
    { id: 'c04-ox-16', text: `User Client Role Mapper の既定の出力先は <code>realm_access.roles</code> である。`, answer: false,
      explain: `User Client Role の既定は <code>resource_access.&lt;client&gt;.roles</code> である。<code>realm_access.roles</code> は User Realm Role の既定である。`, lesson: 'c04-l03' },
    { id: 'c04-ox-17', text: `User Client Role Mapper で Token Claim Name を <code>roles</code> にすると、<code>"roles": ["read","write"]</code> のようなフラットな形で出力できる。`, answer: true,
      explain: `Token Claim Name を指定することで、Client Role を<b class="key">フラットな名前</b>で出力でき、API が読みやすくなる。`, lesson: 'c04-l03' },
    { id: 'c04-ox-18', text: `Audience Resolve は、管理者が指定した client_id を固定で <code>aud</code> に追加する Mapper である。`, answer: false,
      explain: `固定で追加するのは <b class="key">Audience</b> Mapper である。Audience Resolve は、ユーザーがロールを持つ Client を<b class="key">自動</b>で追加する。`, lesson: 'c04-l03' },
    { id: 'c04-ox-19', text: `Group Membership Mapper で Full group path を ON にすると、グループ名がパス付き (例: <code>/company/dev</code>) で出力される。`, answer: true,
      explain: `Full group path が OFF なら <code>["dev","admin"]</code>、ON なら <code>["/company/dev","/admin"]</code> のようにパス付きになる。`, lesson: 'c04-l03' },
    { id: 'c04-ox-20', text: `Hardcoded claim は、ユーザーごとに異なる値を claim に入れる Mapper である。`, answer: false,
      explain: `Hardcoded claim は<b class="key">誰でも同じ固定値</b>を入れる (例: <code>"tenant": "acme"</code>)。ユーザーごとに違う値は User Attribute などで作る。`, lesson: 'c04-l03' },
    { id: 'c04-ox-21', text: `SHA-256 Pairwise sub は、sub をクライアントごとに別の値にして、クライアント間でユーザーを突合できなくする Mapper である。`, answer: true,
      explain: `<b class="key">プライバシー用</b>で、クライアント間で同じユーザーを突き合わせられなくするために sub をクライアントごとに変える。`, lesson: 'c04-l03' },
    { id: 'c04-ox-22', text: `Mapper の Name に付けた文字列が、そのままトークン内の claim 名になる。`, answer: false,
      explain: `Name は管理画面での表示名で、<b class="key">トークンには影響しない</b>。トークン内の claim 名を決めるのは <b class="key">Token Claim Name</b> である。`, lesson: 'c04-l04' },
    { id: 'c04-ox-23', text: `Claim JSON Type を実際の値の型と合わせないと、API 側のパースで失敗することがある。`, answer: true,
      explain: `たとえば数値なのに <code>String</code> にすると、API 側のパースで失敗しうる。値の型に合った Claim JSON Type を選ぶ。`, lesson: 'c04-l04' },
    { id: 'c04-ox-24', text: `claim が API 向けのアクセストークンに出ないとき、最初に疑うのは Add to ID token が OFF になっていることである。`, answer: false,
      explain: `API 向けは <b class="key">Add to access token</b> である。Add to ID token は ID Token に入れる設定で、アプリがユーザーを知るためのものである。`, lesson: 'c04-l04' },
    { id: 'c04-ox-25', text: `手順 A (Audience Mapper) は backend-api を aud に固定で追加し、手順 B は backend-api のロールを持つユーザーに対して aud を自動で追加する。`, answer: true,
      explain: `A は<b class="key">固定</b>、B は<b class="key">ロールに応じて自動</b> (roles スコープの Audience Resolve) という違いがある。`, lesson: 'c04-l04' },
    { id: 'c04-ox-26', text: `ユーザーに backend-api の Client Role を付与しなくても、Audience Resolve により aud に backend-api が自動で追加される。`, answer: false,
      explain: `Audience Resolve は、ユーザーが<b class="key">ロールを持っている Client</b> を追加する。backend-api のロールを持たなければ追加されない。`, lesson: 'c04-l04' },
    { id: 'c04-ox-27', text: `Full Scope Allowed を OFF にすると、許可したロールだけがトークンに載り、最小権限に近づく。`, answer: true,
      explain: `OFF では Client Scope / Client の Scope タブで<b class="key">許可したロールだけ</b>が載る。`, lesson: 'c04-l04' },
    { id: 'c04-ox-28', text: `Full Scope Allowed が ON (既定) のとき、Client の Scope タブで許可したロールだけが載る。`, answer: false,
      explain: `ON (既定) では<b class="key">ユーザーが持つ全ロール</b>が載る。許可したロールだけになるのは OFF のときである。`, lesson: 'c04-l04' }
  ],
  mc: [
    { id: 'c04-mc-01', stem: `【組合せ型】Mapper・Client Scope・Client の関係に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Client Scope は、1個の claim を作る最小の部品である。` },
        { label: 'B', text: `Mapper は、ユーザー情報などの元データを読み取り、トークンの claim に変換する部品である。` },
        { label: 'C', text: `Client は、どの Client Scope を使うかを選ぶ利用者である。` },
        { label: 'D', text: `Client Scope と Mapper は、同じものを指す別名である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× 1個の claim を作る最小部品は Mapper である。Client Scope は Mapper をまとめたセットである。`,
        `B：○ Mapper は元データを読み取って claim に変換する部品である。`,
        `C：○ Client が、使う Client Scope を選ぶ。`,
        `D：× 別のものである。Mapper を何個かまとめたものが Client Scope である。`
      ],
      tip: `Mapper は部品、Client Scope はセット、Client は利用者。「部品 → セット → 利用者」の順で覚える。` },
    { id: 'c04-mc-02', stem: `【正誤選択型】Default Scope と Optional Scope に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        `Default Scope は、リクエストの scope に書かなくても常に適用される。`,
        `Optional Scope は、リクエストの scope に名前を書いたときだけ適用される。`,
        `機微な情報で必要なときだけ渡したいスコープは、Optional にしておくとよい。`,
        `phone を Optional にした場合、scope=openid phone と要求したときだけ phone_number が載る。`,
        `profile、email、roles は、通常 Optional Scope として設定される。`
      ], answer: 5,
      explain: [
        `1：○ Default は常に適用される。`,
        `2：○ Optional は名前を書いたときだけ適用される。`,
        `3：○ 最小限の情報だけ渡すために、機微な情報は Optional にするとよい。`,
        `4：○ Optional の phone は、要求したときだけ phone_number が載る。`,
        `5：× profile、email、roles は通常 Default である。`
      ],
      tip: `常に要る情報は Default、必要なときだけ欲しい機微な情報は Optional。「最小限だけ渡す」が基準である。` },
    { id: 'c04-mc-03', stem: `【組合せ型】Client Scope に関する次の記述のうち、誤っているものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `リクエストで scope=profile と指定しても、Keycloak 上の profile という Client Scope とは無関係なので、その Mapper は動かない。` },
        { label: 'B', text: `openid は、Keycloak が必ず実体の Client Scope として画面に表示する。` },
        { label: 'C', text: `Client Scope の Mappers タブでは、どの claim を作るかを設定する。` },
        { label: 'D', text: `Client Scope の Settings タブの Include in token scope は、トークンの scope claim にスコープ名を載せるかを決める。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：× (誤り) リクエストの scope=profile が、同名の Client Scope を呼び出す。無関係ではない。`,
        `B：× (誤り) openid は scope 文字列に書く特別な値で、実体の Client Scope としては見えないことが多い。`,
        `C：○ (記述は正しい) Mappers タブは、どの claim を作るかを設定する。`,
        `D：○ (記述は正しい) Include in token scope は、scope claim に名前を載せるかを決める。`
      ],
      tip: `リクエストの scope 文字列と、同名の Client Scope が結び付く。ただし openid だけは特別扱いである。` },
    { id: 'c04-mc-04', stem: `【正誤選択型】標準 Client Scope と Dedicated Scope に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `Dedicated Scope は、全 Client が共有する Client Scope である。`,
        `Dedicated Scope は、各 Client に自動で1つ作られ、その Client 専用の Mapper を置く場所である。`,
        `web-origins スコープは、Client の Redirect URI を claim に載せる。`,
        `roles スコープには、Audience Resolve は含まれない。`,
        `offline_access は、address 情報を載せるためのスコープである。`
      ], answer: 2,
      explain: [
        `1：× Dedicated Scope は、その Client 専用のものである。`,
        `2：○ <code>&lt;client名&gt;-dedicated</code> として自動で1つあり、専用の Mapper を置く。`,
        `3：× web-origins は、Web Origins 設定を allowed-origins claim に載せる。`,
        `4：× Audience Resolve は roles スコープに最初から入っている。`,
        `5：× offline_access は、長期間使える Refresh Token (Offline Token) を求めるリクエスト用である。address 情報は address スコープである。`
      ],
      tip: `Dedicated は「専用」。共有する設定は通常の Client Scope、その Client だけの設定は Dedicated に置く。` },
    { id: 'c04-mc-05', stem: `【組合せ型】ロールとグループに関する Mapper の次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `User Client Role Mapper の出力先は、常に realm_access.roles に固定されている。` },
        { label: 'B', text: `User Realm Role Mapper の既定の出力先は、realm_access.roles である。` },
        { label: 'C', text: `Audience Mapper は、ユーザーが持つロールに応じて自動で aud を追加する。` },
        { label: 'D', text: `Group Membership Mapper で Full group path を OFF にすると、["dev","admin"] のようにグループ名だけが出力される。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× User Client Role の既定は resource_access.&lt;client&gt;.roles で、Token Claim Name でフラットな名前にもできる。`,
        `B：○ User Realm Role の既定は realm_access.roles である。`,
        `C：× ロールに応じて自動で追加するのは Audience Resolve である。Audience は指定した client_id を固定で追加する。`,
        `D：○ OFF ならグループ名だけ、ON なら /company/dev のようにパス付きになる。`
      ],
      tip: `Realm Role は realm_access、Client Role は resource_access。Audience は固定、Resolve は自動、と対にする。` },
    { id: 'c04-mc-06', stem: `【正誤選択型】Mapper の設定項目に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `Mapper の Name は、トークン内の claim 名になる。`,
        `Token Claim Name に org.dept を指定すると、org.dept という名前の1つの claim ができる。`,
        `Multivalued を OFF にすると、値は配列になる。`,
        `Token Claim Name に org.dept を指定すると、{"org": {"dept": "sales"}} のようにネストした形で出力される。`,
        `Claim JSON Type は、claim を出力する先のトークンを選ぶ設定である。`
      ], answer: 4,
      explain: [
        `1：× Name は管理画面での表示名で、トークンには影響しない。claim 名は Token Claim Name で決まる。`,
        `2：× . はネストを表す。1つの claim 名に . を含めたいときは a\\.b のようにエスケープする。`,
        `3：× 配列になるのは Multivalued が ON のときである。`,
        `4：○ . でネストするため、org の中に dept が入る形になる。`,
        `5：× Claim JSON Type は値の型 (String, int, boolean, JSON など) の設定である。出力先は Add to ... のチェックで決まる。`
      ],
      tip: `Name は表示名、Token Claim Name は出力名、JSON Type は値の型、Add to ... は載せ先。4つの役割を分けて覚える。` },
    { id: 'c04-mc-07', stem: `【組合せ型】Mapper の Add to ... の設定に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Add to access token が OFF でも、API 向けのアクセストークンには claim が載る。` },
        { label: 'B', text: `Add to ID token を ON にすると、claim は自動的に /userinfo の返り値にも入る。` },
        { label: 'C', text: `Add to userinfo を ON にすると、claim が /userinfo の返り値に入る。` },
        { label: 'D', text: `Add to token introspection を ON にすると、claim が /token/introspect の返り値に入る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× Add to access token が OFF だと、アクセストークンには載らない。claim が出ないとき最初に疑う点である。`,
        `B：× 載せ先は設定ごとに別である。/userinfo に入れるには Add to userinfo を ON にする。`,
        `C：○ Add to userinfo が /userinfo の返り値に対応する。`,
        `D：○ Add to token introspection が /token/introspect の返り値に対応する。`
      ],
      tip: `Add to ... は「載せ先ごとのスイッチ」。載せたい先のスイッチを個別に ON にする。` },
    { id: 'c04-mc-08', stem: `【正誤選択型】claim が出ないときの確認に関する次の記述のうち、誤っているものはどれか。`, items: [],
      choices: [
        `claim が API 向けのトークンに出ないとき、最初に疑うのは Add to ID token が OFF のことである。`,
        `Add to access token は、API が認可判断に使う claim を入れるための設定である。`,
        `Add to ID token は、アプリがユーザーを知るための claim を ID Token に入れる設定である。`,
        `Add to lightweight access token は、通常は OFF にしてトークンを小さく保つ。`,
        `「どのトークンに載るか」は、Add to ... のチェックで決まる。`
      ], answer: 1,
      explain: [
        `1：× API 向けのアクセストークンに出ないとき最初に疑うのは Add to access token が OFF のことである。`,
        `2：○ Access Token は API が認可判断に使う。`,
        `3：○ ID Token は、アプリがユーザーを知るためのものである。`,
        `4：○ lightweight access token には、通常は載せずに小さく保つ。`,
        `5：○ 載せ先は Add to ... のチェックで決まる。`
      ],
      tip: `API に届くのは Access Token。API 向けの claim が出ないなら、まず Add to access token を見る。` },
    { id: 'c04-mc-09', stem: `【組合せ型】API が aud=backend-api を要求する場合の対処に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `aud が ["account"] だけだと、backend-api が aud を要求する API では 401 になりうる。` },
        { label: 'B', text: `Audience Mapper は frontend-spa の Dedicated Scope には追加できず、roles スコープにしか置けない。` },
        { label: 'C', text: `ユーザーが backend-api の Client Role を持つと、roles スコープの Audience Resolve により aud に backend-api が追加される。` },
        { label: 'D', text: `Full Scope Allowed が OFF のとき、Client の Scope タブの設定は不要で、ロールは自動で載る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ aud に backend-api が無いと、API が拒否して 401 になる。`,
        `B：× frontend-spa-dedicated に Audience Mapper を追加する手順 A がある。`,
        `C：○ Audience Resolve は、ロールを持つ Client を aud に自動追加する。`,
        `D：× Full Scope Allowed が OFF の場合は、Client の Scope タブでそのロールを許可する必要がある。`
      ],
      tip: `aud に名前が無い → 固定で足す (Audience) か、ロールを持たせて自動で足す (Resolve)。OFF のときは許可も要る。` },
    { id: 'c04-mc-10', stem: `【正誤選択型】Full Scope Allowed と Lightweight Access Token に関する次の記述のうち、正しいものはどれか。`, items: [],
      choices: [
        `Full Scope Allowed が ON (既定) では、許可したロールだけがトークンに載る。`,
        `Full Scope Allowed が OFF だと、ユーザーが持つ全ロールがトークンに載る。`,
        `Full Scope Allowed を OFF にして必要なロールだけ許可すると、最小権限に近づく。`,
        `Lightweight Access Token は、claim を増やして詳細を載せるための方式である。`,
        `Lightweight Access Token は、Client の Settings タブで有効化する。`
      ], answer: 3,
      explain: [
        `1：× ON (既定) では、ユーザーが持つ全ロールが載る。`,
        `2：× OFF のときは、許可したロールだけが載る。`,
        `3：○ OFF にして必要なロールだけ許可するのが最小権限の考え方である。`,
        `4：× Lightweight Access Token は Access Token を小さくし、詳細な claim は userinfo / introspection で取る方式である。`,
        `5：× Client の Advanced タブで有効化する。`
      ],
      tip: `Full Scope Allowed は ON = 全部載る・簡単、OFF = 許可したものだけ・最小権限。広さと手軽さのトレードオフである。` }
  ]
});
