window.DATA = { chapters: [] };
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
// Keycloak 大全集 data part 2: 章 5〜7
DATA.chapters.push({
  no: 5, title: `Client 設定`,
  lessons: [
    { id: 'c05-l01', title: `基本項目・Capability config`, pages: [
      { id: 'c05-l01-p01', title: `Client 設定の見方と基本項目`,
        html: `<p>Clients から対象クライアントを開くと、タブごとに設定項目が並ぶ。Client は「アプリの入館証の設定」と考えると分かりやすい。どの入口(フロー)から入れるか、戻ってよい場所(URL)、本人確認の方法(認証)を決めるものである。</p><h4>Settings タブ上部の基本項目</h4><ul><li><b class="key">Client ID</b>：アプリを識別する名前で、<b class="key">自分で決める文字列</b>(例 <code>frontend-spa</code>)。認可リクエストの <code>client_id=</code> に使い、トークンの <code>azp</code> / <code>aud</code> にも出る</li><li><b class="key">Client UUID</b>：Keycloak 内部の ID。画面には出にくく、Admin REST API の URL(<code>/clients/{uuid}</code>)で使う。Client ID とは別物</li><li><b class="key">Name / Description</b>：管理画面の表示用。動作には影響しない</li><li><b class="key">Always display in UI</b>：ログイン後のアカウント画面に、このアプリを必ず表示するか</li></ul><span class="trap">Client ID と Client UUID の混同に注意。ログインやトークンに出るのは Client ID、Admin REST API の URL で使うのは Client UUID である。</span>`,
        oxIds: ['c05-ox-01', 'c05-ox-02'] },
      { id: 'c05-l01-p02', title: `Capability config：Client authentication と Authorization`,
        html: `<p>Capability config は、このクライアントの「能力」を決める欄である。まず最初に見る 2 つのスイッチを押さえる。</p><h4>Client authentication</h4><ul><li>ON ＝ <b class="key">Confidential client</b>(secret 等で本人証明する)</li><li>OFF ＝ <b class="key">Public client</b>(secret を持てない)</li><li>ON / OFF が何を変えるのかは、第6章で詳しく扱う</li></ul><h4>Authorization</h4><ul><li>ON にすると <b class="key">Authorization Services</b>(リソース・ポリシー・パーミッションによる細かい認可)が使えるようになる</li><li>普通のロール認可だけなら、<b class="key">OFF のまま</b>でよい</li></ul><span class="trap">「Authorization」は認可全般を有効にするスイッチではない。ON にして使えるのは Authorization Services という細かい認可の仕組みで、普通のロール認可だけなら必要ない。</span>`,
        oxIds: ['c05-ox-03'] },
      { id: 'c05-l01-p03', title: `Authentication flow(1)：Standard・Direct access・Implicit・Service accounts`,
        html: `<p>Authentication flow は、このクライアントに許可する「トークンの取り方」を選ぶチェックボックスである。前半の 4 つを整理する。</p><table><tr><th>チェックボックス</th><th>対応する方式</th><th>位置づけ</th></tr><tr><td><b class="key">Standard flow</b></td><td>Authorization Code Flow(ブラウザでログイン → code → token)</td><td>通常はこれ</td></tr><tr><td><b class="key">Direct access grants</b></td><td>Password Grant(アプリが ID / パスワードを直接受け取る)</td><td>非推奨(テスト用)</td></tr><tr><td><b class="key">Implicit flow</b></td><td>ブラウザにトークンを直接返す古い方式</td><td>非推奨</td></tr><tr><td><b class="key">Service accounts roles</b></td><td>Client Credentials Grant(ユーザー不在で、クライアント自身がトークンを取る)</td><td>Client authentication ON が必要</td></tr></table><h4>読み解き方</h4><ul><li>ユーザーがログインするアプリは Standard flow を使う</li><li>Direct access grants は、アプリがユーザーのパスワードを直接受け取ってしまう方式なので避ける</li></ul><span class="trap">Service accounts roles は「ユーザー不在でクライアント自身が認証する」方式なので、secret 等で本人証明できる Client authentication ON のクライアントでしか使えない。</span>`,
        oxIds: ['c05-ox-04', 'c05-ox-05'] },
      { id: 'c05-l01-p04', title: `Authentication flow(2)と PKCE Method`,
        html: `<h4>残りのチェックボックス</h4><ul><li><b class="key">OAuth 2.0 Device Authorization Grant</b>：TV や CLI 向けのデバイスフロー</li><li><b class="key">OIDC CIBA Grant</b>：ユーザーが別端末(スマホ)で承認するバックチャネル認証。銀行などで使われる</li><li><b class="key">Standard Token Exchange</b>(v26.2+)：手持ちのトークンを、別の audience 用のトークンに交換する</li></ul><h4>原則</h4><p>Authentication flow は、<b class="key">使うものだけ ON、他は OFF</b> にする。許可する取り方が少ないほど、攻撃面(狙われる入口)が減るからである。</p><h4>PKCE Method(Advanced タブ内)</h4><ul><li><code>S256</code> を指定すると、PKCE(<code>code_challenge</code>)が付いていないリクエストを<b class="key">拒否</b>する</li><li>つまり PKCE を「推奨」から「強制」に変える設定である</li></ul><span class="trap">PKCE Method の指定は「警告を出すだけ」ではない。S256 を指定すると、PKCE の無い認可リクエストは拒否される。</span>`,
        oxIds: ['c05-ox-06', 'c05-ox-07'] }
    ] },
    { id: 'c05-l02', title: `Access・Login・Logout settings`, pages: [
      { id: 'c05-l02-p01', title: `Root URL・Home URL・Valid redirect URIs`,
        html: `<p>Access settings は URL に関する設定である。中でも Valid redirect URIs は最重要のセキュリティ設定になる。</p><h4>基準となる URL</h4><ul><li><b class="key">Root URL</b>：アプリの基準 URL。他の相対 URL の頭に付く(例 <code>https://app.example.com</code>)</li><li><b class="key">Home URL</b>：アカウント画面などから「アプリへ戻る」ときのリンク先</li></ul><h4>Valid redirect URIs</h4><ul><li>何か：ログイン成功後に <code>code</code> を持たせて<b class="key">戻してよい URL のホワイトリスト</b></li><li>なぜ必要か：攻撃者の URL に code を送らせないため</li><li>書き方：<b class="key">完全一致</b>、または末尾 <code>*</code> でワイルドカード</li><li>例：<code>http://localhost:3000/callback</code> / <code>https://app.example.com/*</code></li><li>不一致のときのエラー：<code>Invalid parameter: redirect_uri</code></li></ul><span class="trap">本番で <code>*</code> だけを指定するのは危険である。どの URL にも code を戻せてしまい、ホワイトリストの意味がなくなる。</span>`,
        oxIds: ['c05-ox-08', 'c05-ox-09'] },
      { id: 'c05-l02-p02', title: `Valid post logout redirect URIs・Web origins・Admin URL`,
        html: `<h4>Valid post logout redirect URIs</h4><ul><li>ログアウト後に戻してよい URL。logout の <code>post_logout_redirect_uri</code> に使う</li></ul><h4>Web origins</h4><ul><li>何か：ブラウザの <b class="key">CORS で許可する送信元</b>。SPA が token endpoint を fetch するときに必要になる</li><li>例：<code>https://app.example.com</code></li><li><code>+</code> ＝ Valid redirect URIs の origin を自動で許可する</li><li><code>*</code> ＝ 全許可(非推奨)</li><li>設定した値は、トークンの <code>allowed-origins</code> claim になる</li></ul><h4>Admin URL</h4><ul><li>Keycloak からアプリへ通知を送る先(バックチャネルログアウトなど)</li></ul><span class="trap"><code>+</code> と <code>*</code> を取り違えやすい。<code>+</code> は Valid redirect URIs に合わせて許可、<code>*</code> は何でも許可である。許可範囲が広い <code>*</code> は避ける。</span><p>Valid redirect URIs は「code の戻り先」、Web origins は「ブラウザの fetch を許す送信元」と、役割が別である。</p>`,
        oxIds: ['c05-ox-10', 'c05-ox-11'] },
      { id: 'c05-l02-p03', title: `Login settings と Logout settings`,
        html: `<h4>Login settings</h4><ul><li><b class="key">Login theme</b>：ログイン画面のデザインを Client ごとに変える</li><li><b class="key">Consent required</b>：ログイン時に「このアプリに情報を渡してよいか」の<b class="key">同意画面</b>を出す</li><li><b class="key">Display client on screen</b>：同意画面にクライアント名を表示する</li></ul><h4>Logout settings</h4><ul><li><b class="key">Front channel logout</b>：<b class="key">ブラウザ経由</b>(iframe)でアプリにログアウトを通知する</li><li><b class="key">Backchannel logout URL</b>：Keycloak がアプリの<b class="key">サーバーへ直接</b> <code>logout_token</code> を POST する先</li><li><b class="key">Backchannel logout session required</b>：<code>logout_token</code> に <code>sid</code> を含める</li></ul><span class="trap">Front channel は「ブラウザ経由」、Backchannel は「サーバー同士の直接通信」である。<code>logout_token</code> を直接 POST するのは Backchannel の方。</span>`,
        oxIds: ['c05-ox-12'] }
    ] },
    { id: 'c05-l03', title: `Credentials・各タブ・Token 寿命`, pages: [
      { id: 'c05-l03-p01', title: `Credentials タブと Client Authenticator`,
        html: `<p>Credentials タブは、<b class="key">Client authentication ON のときだけ</b>表示される。ここで、トークン取得時に「自分が本物のクライアントだ」と示す方法(Client Authenticator)を選ぶ。</p><table><tr><th>方式</th><th>送るもの</th><th>特徴</th></tr><tr><td><b class="key">Client Id and Secret</b>(<code>client_secret_basic</code> / <code>client_secret_post</code>)</td><td>共通の合言葉(secret)</td><td>一番簡単で一般的。basic は <code>Authorization: Basic</code> ヘッダ、post は body に載せる</td></tr><tr><td><b class="key">Signed Jwt</b>(<code>private_key_jwt</code>)</td><td>秘密鍵で署名した JWT</td><td>Keycloak は登録済みの公開鍵で検証。secret が通信に乗らず安全。金融系などで使う</td></tr><tr><td>Signed Jwt with Client Secret(<code>client_secret_jwt</code>)</td><td>secret を鍵にして署名した JWT</td><td>—</td></tr><tr><td>X509 Certificate(mTLS)</td><td>クライアント証明書</td><td>証明書で本人確認する</td></tr></table><h4>secret の管理</h4><ul><li><b class="key">Client secret</b>：合言葉の実体。<b class="key">Regenerate</b> で再生成でき、古い secret は即無効になる</li><li><b class="key">Client secret rotation</b>：旧 secret を一定期間だけ併用して、無停止で入れ替える機能</li></ul>`,
        oxIds: ['c05-ox-13', 'c05-ox-14'] },
      { id: 'c05-l03-p02', title: `Client scopes・Roles・Service accounts roles・Advanced タブ`,
        html: `<p>クライアント設定には、Settings 以外にも目的別のタブがある。</p><ul><li><b class="key">Client scopes</b> タブ：このクライアントに紐付ける Client Scope と Default / Optional を決める(第4章)<ul><li><b class="key">Evaluate</b> サブタブ：ユーザーを選んで、<b class="key">実際のトークン内容をプレビュー</b>できる。デバッグに便利</li></ul></li><li><b class="key">Roles</b> タブ：このクライアント専用の Client Role を作る場所(例 <code>read</code>、<code>write</code>)</li><li><b class="key">Service accounts roles</b> タブ：Service accounts roles が ON のときに出る。Client Credentials で取ったトークンに付くロールの設定場所</li></ul><h4>Advanced タブの主な項目</h4><ul><li><b class="key">Access Token Lifespan</b>：このクライアントだけトークン寿命を変える(Realm 設定を上書き)</li><li><b class="key">Proof Key for Code Exchange Code Challenge Method</b>：PKCE の強制(S256)</li><li><b class="key">Lightweight access token</b>：軽量アクセストークンを使う</li><li><b class="key">Authentication flow overrides</b>：このクライアントだけログイン手順を別フローにする</li></ul><span class="trap">Client Role を作るのは Roles タブ、Client Credentials のトークンに付くロールを決めるのは Service accounts roles タブである。置き場所を混同しないこと。</span>`,
        oxIds: ['c05-ox-15'] },
      { id: 'c05-l03-p03', title: `Token 寿命(Realm 全体の設定)`,
        html: `<p>トークンやセッションの寿命は、Realm settings の Tokens / Sessions で決める。クライアントごとに変えたいときは、前のページの Advanced タブで上書きする。</p><table><tr><th>項目</th><th>既定</th><th>意味</th></tr><tr><td><b class="key">Access Token Lifespan</b></td><td>5 分</td><td>アクセストークンが有効な時間。短いほど漏洩に強い</td></tr><tr><td><b class="key">SSO Session Idle</b></td><td>30 分</td><td>何も操作がなければ、ログイン状態が切れるまでの時間</td></tr><tr><td><b class="key">SSO Session Max</b></td><td>10 時間</td><td>操作していても強制的にログアウトされる上限</td></tr><tr><td>Client Session Idle / Max</td><td>—</td><td>クライアント単位のセッション期限(Refresh Token の寿命に影響)</td></tr><tr><td><b class="key">Offline Session Idle</b></td><td>30 日</td><td>オフライントークンの期限</td></tr></table><span class="trap">Idle は「操作がない時間」の上限、Max は「操作の有無に関係なく」効く上限である。両方に別々の期限がある点に注意。</span>`,
        oxIds: ['c05-ox-16', 'c05-ox-17'] }
    ] }
  ],
  ox: [
    { id: 'c05-ox-01', text: `Client ID は Keycloak が自動で割り当てる内部 ID であり、Admin REST API の URL(<code>/clients/{uuid}</code>)にはこの値を使う。`, answer: false,
      explain: `Client ID は<b class="key">自分で決める文字列</b>である。Admin REST API の URL で使うのは、Keycloak 内部の ID である <b class="key">Client UUID</b> で、Client ID とは別物。`, lesson: 'c05-l01' },
    { id: 'c05-ox-02', text: `Client ID は認可リクエストの <code>client_id</code> に使われ、トークンの <code>azp</code> や <code>aud</code> にも現れる。`, answer: true,
      explain: `Client ID はアプリを識別する名前なので、認可リクエストの <code>client_id</code> に使われ、トークンの <b class="key">azp / aud</b> にも出る。`, lesson: 'c05-l01' },
    { id: 'c05-ox-03', text: `Authorization を ON にすると Authorization Services が使えるようになるが、ロールによる普通の認可だけなら OFF のままでよい。`, answer: true,
      explain: `Authorization は、リソース・ポリシー・パーミッションによる細かい認可(<b class="key">Authorization Services</b>)を使うためのスイッチである。普通のロール認可には不要。`, lesson: 'c05-l01' },
    { id: 'c05-ox-04', text: `Direct access grants は Password Grant に当たる方式で、アプリが ID とパスワードを直接受け取るため、非推奨(テスト用)とされる。`, answer: true,
      explain: `<b class="key">Direct access grants</b> は Password Grant に当たる。アプリがユーザーの ID / パスワードを直接受け取る方式なので、非推奨でテスト用にとどめる。`, lesson: 'c05-l01' },
    { id: 'c05-ox-05', text: `Service accounts roles(Client Credentials Grant)は、Client authentication が OFF の Public client でも使える。`, answer: false,
      explain: `Service accounts roles には <b class="key">Client authentication ON</b> が必要である。ユーザー不在でクライアント自身が本人証明をする方式なので、secret 等を持てる Confidential client で使う。`, lesson: 'c05-l01' },
    { id: 'c05-ox-06', text: `PKCE Method に <code>S256</code> を指定すると、PKCE の <code>code_challenge</code> が付いていない認可リクエストでも、警告付きで受け付けられる。`, answer: false,
      explain: `<code>S256</code> を指定すると、PKCE の無いリクエストは警告付きで通るのではなく<b class="key">拒否</b>される。PKCE を強制する設定である。`, lesson: 'c05-l01' },
    { id: 'c05-ox-07', text: `Authentication flow は、使うものだけ ON にして他は OFF にする。これは攻撃面を減らすためである。`, answer: true,
      explain: `許可する取り方が少ないほど、狙われる入口が減る。そのため原則は<b class="key">使うものだけ ON、他は OFF</b>である。`, lesson: 'c05-l01' },
    { id: 'c05-ox-08', text: `Valid redirect URIs は、ログイン成功後に <code>code</code> を持たせて戻してよい URL のホワイトリストであり、攻撃者の URL に code を送らせないための設定である。`, answer: true,
      explain: `<b class="key">Valid redirect URIs</b> は code の戻り先を登録 URL に限定する。攻撃者の URL に code が送られるのを防ぐ、最重要のセキュリティ設定である。`, lesson: 'c05-l02' },
    { id: 'c05-ox-09', text: `Home URL は、ログイン成功後に <code>code</code> を持たせてブラウザを戻す URL であり、認可リクエストの <code>redirect_uri</code> と照合される。`, answer: false,
      explain: `code を持たせて戻してよい URL を決めるのは <b class="key">Valid redirect URIs</b> である。<b class="key">Home URL</b> は、アカウント画面などから「アプリへ戻る」ときのリンク先にすぎない。`, lesson: 'c05-l02' },
    { id: 'c05-ox-10', text: `Web origins は、ブラウザの CORS で許可する送信元を指定する設定で、SPA が token endpoint を fetch するときに必要になる。`, answer: true,
      explain: `ブラウザは別オリジンへの fetch を CORS で制限する。そのため、SPA が token endpoint を呼ぶ場合は <b class="key">Web origins</b> に送信元を登録する。`, lesson: 'c05-l02' },
    { id: 'c05-ox-11', text: `Web origins に <code>*</code> を指定すると、Valid redirect URIs の origin だけが自動で許可される。`, answer: false,
      explain: `Valid redirect URIs の origin を自動で許可するのは <code>+</code> である。<code>*</code> は<b class="key">全許可</b>で、非推奨。`, lesson: 'c05-l02' },
    { id: 'c05-ox-12', text: `Front channel logout は、Keycloak がアプリのサーバーへ直接 <code>logout_token</code> を POST して、ログアウトを通知する方式である。`, answer: false,
      explain: `<b class="key">Front channel logout</b> はブラウザ経由(iframe)の通知である。サーバーへ直接 <code>logout_token</code> を POST するのは <b class="key">Backchannel logout URL</b> の方。`, lesson: 'c05-l02' },
    { id: 'c05-ox-13', text: `Credentials タブは、Client authentication が OFF のときにだけ表示される。`, answer: false,
      explain: `Credentials タブは <b class="key">Client authentication ON のときだけ</b>表示される。OFF の Public client には secret 等が無いため、このタブも無い。`, lesson: 'c05-l03' },
    { id: 'c05-ox-14', text: `Signed Jwt(<code>private_key_jwt</code>)は、secret が通信に乗らないため、secret を送る方式より安全とされる。`, answer: true,
      explain: `クライアントが秘密鍵で署名した JWT を送り、Keycloak は登録済みの<b class="key">公開鍵</b>で検証する。共有の合言葉(secret)を送らないので安全で、金融系などで使われる。`, lesson: 'c05-l03' },
    { id: 'c05-ox-15', text: `Client scopes タブの Evaluate サブタブでは、ユーザーを選んで、実際のトークンの内容をプレビューできる。`, answer: true,
      explain: `<b class="key">Evaluate</b> は、ユーザーを選んで実際のトークン内容を確認できるため、claim が出ない問題などのデバッグに便利である。`, lesson: 'c05-l03' },
    { id: 'c05-ox-16', text: `SSO Session Idle は、操作を続けていても強制的にログアウトされる上限時間を表す。`, answer: false,
      explain: `操作していても強制ログアウトされる上限は <b class="key">SSO Session Max</b>(既定 10 時間)である。<b class="key">SSO Session Idle</b>(既定 30 分)は、何も操作がないときにログイン状態が切れるまでの時間。`, lesson: 'c05-l03' },
    { id: 'c05-ox-17', text: `Access Token Lifespan は既定で 5 分であり、短いほど、アクセストークンが漏れたときの被害を抑えられる。`, answer: true,
      explain: `アクセストークンの有効時間が短いほど、漏洩に強い。既定は <b class="key">5 分</b>で、Realm 全体の設定として決まる。`, lesson: 'c05-l03' }
  ],
  mc: [
    { id: 'c05-mc-01', stem: `【組合せ型】Client の Access settings に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Valid redirect URIs は、アカウント画面などから「アプリへ戻る」ときのリンク先を決める設定である。` },
        { label: 'B', text: `Valid redirect URIs は、ログイン成功後に code を持たせて戻してよい URL のホワイトリストである。` },
        { label: 'C', text: `Web origins は、ブラウザの CORS で許可する送信元を決める設定である。` },
        { label: 'D', text: `Web origins に <code>+</code> を指定すると、すべての送信元が許可される。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× 「アプリへ戻る」ときのリンク先は Home URL である。Valid redirect URIs は code の戻り先を限定する設定。`,
        `B：○ code を戻してよい URL を登録 URL に限定し、攻撃者の URL に code を送らせない。`,
        `C：○ SPA がブラウザから token endpoint を fetch するときなどに、CORS の許可元として必要になる。`,
        `D：× <code>+</code> は Valid redirect URIs の origin を自動で許可する指定である。全許可は <code>*</code>(非推奨)。`
      ],
      tip: `「code の戻り先は Valid redirect URIs、ブラウザ fetch の許可元は Web origins、戻るリンクは Home URL」と、役割で区別する。` },
    { id: 'c05-mc-02', stem: `【正誤選択型】Client の基本項目に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Client ID は自分で決める文字列で、Admin REST API の URL には別物の Client UUID を使う。',
        'Client UUID は、認可リクエストの client_id として指定する値である。',
        'Name と Description は、省略するとログインの動作が変わる設定である。',
        'Always display in UI は、同意画面にクライアント名を表示する設定である。',
        'Client ID は Keycloak が自動で決める内部 ID で、利用者は決められない。'
      ], answer: 1,
      explain: [
        `1：○ Client ID は自分で決める文字列。Admin REST API の URL では Keycloak 内部の Client UUID を使う。`,
        `2：× 認可リクエストの <code>client_id</code> に使うのは Client ID である。Client UUID は内部 ID。`,
        `3：× Name / Description は管理画面の表示用で、動作には影響しない。`,
        `4：× 同意画面にクライアント名を出すのは Display client on screen。Always display in UI は、アカウント画面にアプリを必ず表示するかの設定。`,
        `5：× Client ID は自分で決める文字列である。内部 ID は Client UUID の方。`
      ],
      tip: `外に出て使う名前は Client ID(自分で決める)、Keycloak の中だけで使う識別子は Client UUID、と分けて覚える。` },
    { id: 'c05-mc-03', stem: `【組合せ型】Authentication flow の各チェックボックスに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Standard flow は Password Grant に当たり、アプリが ID とパスワードを直接受け取る方式である。` },
        { label: 'B', text: `Implicit flow はブラウザにトークンを直接返す方式で、現在も通常はこれを使うのがよい。` },
        { label: 'C', text: `Service accounts roles は Client Credentials Grant に当たり、Client authentication ON が必要である。` },
        { label: 'D', text: `Direct access grants は Password Grant に当たるが、非推奨でありテスト用にとどめる。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× Standard flow は Authorization Code Flow である。Password Grant に当たるのは Direct access grants。`,
        `B：× Implicit flow は古い方式で非推奨。通常使うのは Standard flow。`,
        `C：○ ユーザー不在でクライアント自身がトークンを取る方式で、本人証明のため Client authentication ON が必要。`,
        `D：○ アプリがパスワードを直接受け取るので非推奨。テスト用に限る。`
      ],
      tip: `「ブラウザでログインさせるなら Standard flow。パスワードを直接扱う Direct access grants と古い Implicit flow は避ける」と因果で覚える。` },
    { id: 'c05-mc-04', stem: `【正誤選択型】Credentials タブと Client Authenticator に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Credentials タブは、Client authentication が OFF のときにだけ表示される。',
        'Client Id and Secret は、secret を一切通信に載せない方式である。',
        'Signed Jwt with Client Secret は、秘密鍵で署名した JWT を公開鍵で検証する方式である。',
        'Signed Jwt は、秘密鍵で署名した JWT を送るため、secret が通信に乗らない。',
        'X509 Certificate は、secret を鍵にして署名した JWT で本人確認する方式である。'
      ], answer: 4,
      explain: [
        `1：× Credentials タブは Client authentication ON のときだけ表示される。`,
        `2：× Client Id and Secret は、secret を Authorization: Basic ヘッダまたは body に載せて送る方式である。`,
        `3：× 秘密鍵で署名し公開鍵で検証するのは Signed Jwt(<code>private_key_jwt</code>)。Signed Jwt with Client Secret は secret を鍵にして署名する。`,
        `4：○ Keycloak は登録済みの公開鍵で検証するので、secret が通信に乗らない。`,
        `5：× X509 Certificate はクライアント証明書(mTLS)で本人確認する方式である。`
      ],
      tip: `「何を送って本人証明するか」で区別する。secret を送る / secret で署名 / 秘密鍵で署名 / 証明書、の4通り。` },
    { id: 'c05-mc-05', stem: `【組合せ型】Token 寿命とセッション期限に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Access Token Lifespan は短いほど漏洩に強く、Advanced タブでそのクライアントだけ Realm 設定を上書きできる。` },
        { label: 'B', text: `SSO Session Idle は、操作していても強制的にログアウトされる上限時間である。` },
        { label: 'C', text: `SSO Session Max は、操作を続けていても強制的にログアウトされる上限時間である。` },
        { label: 'D', text: `Offline Session Idle は、アクセストークンが有効な時間を決める設定である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ アクセストークンの寿命は短いほど漏洩に強く、クライアント単位で Advanced タブから上書きできる。`,
        `B：× 操作がない時間の上限が Idle。操作していても切れる上限は Max。`,
        `C：○ SSO Session Max(既定 10 時間)は、操作の有無に関係なく効く上限である。`,
        `D：× Offline Session Idle はオフライントークンの期限(既定 30 日)。アクセストークンの寿命は Access Token Lifespan。`
      ],
      tip: `Idle は「放置」で切れる、Max は「使っていても」切れる。対象も別(セッションとトークン)と分けて考える。` },
    { id: 'c05-mc-06', stem: `【正誤選択型】Client の secret 管理とタブの役割に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Regenerate で secret を再生成しても、古い secret はそのまま使い続けられる。',
        'Roles タブは、Client Credentials で取ったトークンに付くロールを設定する場所である。',
        'Client scopes タブは、そのクライアント専用の Client Role を作る場所である。',
        'Client secret rotation は、旧 secret を即座に無効にして新 secret へ切り替える機能である。',
        'Client secret rotation は、旧 secret を一定期間だけ併用できるため、無停止で入れ替えられる。'
      ], answer: 5,
      explain: [
        `1：× Regenerate で再生成すると、古い secret は即無効になる。`,
        `2：× Client Credentials のトークンに付くロールは Service accounts roles タブで設定する。Roles タブは Client Role を作る場所。`,
        `3：× Client Role を作るのは Roles タブ。Client scopes タブは Client Scope の紐付けを決める場所。`,
        `4：× 即時に切り替えるのは Regenerate。rotation は旧 secret を一定期間併用する。`,
        `5：○ 併用期間があるので、アプリ側の更新が追いつくまで止めずに入れ替えられる。`
      ],
      tip: `Regenerate は「即・古いものが無効」、rotation は「しばらく新旧併用」。止められないシステムには rotation。` },
    { id: 'c05-mc-07', stem: `【組合せ型】Login settings と Logout settings に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Front channel logout は、Keycloak がアプリのサーバーへ直接 logout_token を POST する方式である。` },
        { label: 'B', text: `Backchannel logout URL は、Keycloak がアプリのサーバーへ直接 logout_token を POST する先である。` },
        { label: 'C', text: `Consent required を ON にすると、Client ごとにログイン画面のデザインが切り替わる。` },
        { label: 'D', text: `Consent required を ON にすると、ログイン時に情報を渡してよいかを確認する同意画面が出る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× Front channel はブラウザ経由(iframe)の通知である。サーバーへの直接 POST は Backchannel。`,
        `B：○ サーバー同士の直接通信で logout_token を渡す。`,
        `C：× Client ごとにログイン画面のデザインを変えるのは Login theme。`,
        `D：○ 「このアプリに情報を渡してよいか」を確認する同意画面を出す。`
      ],
      tip: `Front は「ブラウザ経由」、Back は「裏(サーバー直通)」。Consent は「同意」、theme は「見た目」と言葉で区別する。` },
    { id: 'c05-mc-08', stem: `【正誤選択型】Client 設定の考え方に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Authentication flow は、将来使うかもしれないものを、すべて ON にしておくのがよい。',
        'Authentication flow は、使うものだけ ON にして他は OFF にし、攻撃面を減らす。',
        '本番環境でも、Valid redirect URIs は * だけにしておくのが安全である。',
        'Authorization を ON にすると、通常のロール認可が使えるようになる。',
        'Implicit flow は、通常の SPA が最初に選ぶべき方式である。'
      ], answer: 2,
      explain: [
        `1：× 許可する取り方が増えるほど攻撃面が広がる。使うものだけ ON にする。`,
        `2：○ 許可する入口を絞ることで、攻撃面を減らせる。`,
        `3：× 本番で <code>*</code> だけを指定するのは危険。どの URL にも code を戻せてしまう。`,
        `4：× Authorization は Authorization Services を使うためのスイッチ。普通のロール認可には不要。`,
        `5：× Implicit flow は非推奨の古い方式。通常使うのは Standard flow。`
      ],
      tip: `Client 設定の原則は「許可は最小限」。flow も redirect URI も、必要なものだけ具体的に開ける。` }
  ]
});

DATA.chapters.push({
  no: 6, title: `Client authentication ON / OFF`,
  lessons: [
    { id: 'c06-l01', title: `要点・比較表・token リクエストの差`, pages: [
      { id: 'c06-l01-p01', title: `ON と OFF の要点：何を分けるスイッチか`,
        html: `<p>Client authentication は、Client 設定の中でも特に重要なスイッチである。ON か OFF かで、クライアントの種類と使える機能が変わる。</p><h4>ON と OFF</h4><ul><li>ON ＝ <b class="key">Confidential client</b>(秘密を安全に保持できる)<ul><li>サーバーサイド Web アプリ、バックエンド、バッチ</li></ul></li><li>OFF ＝ <b class="key">Public client</b>(秘密を持てない)<ul><li>SPA(React / Vue)、モバイル、デスクトップ、CLI</li><li>配布物に secret を入れても<b class="key">抜き取られる</b>ので意味がない</li></ul></li></ul><h4>本質</h4><p>このスイッチの本質は、<b class="key">「トークンエンドポイントで、このクライアント自身が本人だと証明できるか」</b>である。証明できる(秘密を守れる)なら ON、できないなら OFF になる。</p><span class="trap">ON / OFF は「ユーザーがどう認証するか」を決めるスイッチではない。証明する相手はユーザーではなく、クライアントアプリ自身である。</span>`,
        oxIds: ['c06-ox-01', 'c06-ox-02'] },
      { id: 'c06-l01-p02', title: `ON / OFF の比較表`,
        html: `<p>ON と OFF の違いを、項目ごとに並べて整理する。</p><table><tr><th>項目</th><th>ON (Confidential)</th><th>OFF (Public)</th></tr><tr><td>OAuth 用語</td><td>confidential</td><td>public</td></tr><tr><td>Credentials タブ</td><td>あり(secret 等)</td><td>なし</td></tr><tr><td>token 要求時の認証</td><td>client_id + secret(等)が必須</td><td><code>client_id</code> のみ</td></tr><tr><td>Authorization Code Flow</td><td>○</td><td>○(<b class="key">PKCE 必須級</b>)</td></tr><tr><td>PKCE</td><td>推奨(併用可)</td><td><b class="key">事実上必須</b></td></tr><tr><td>Client Credentials Grant</td><td>○(Service accounts roles)</td><td>✕ 使えない</td></tr><tr><td>Direct Access Grants</td><td>○</td><td>○(非推奨)</td></tr><tr><td>Device Flow</td><td>○</td><td>○(よく使う)</td></tr><tr><td>Authorization Services</td><td>○</td><td>✕</td></tr><tr><td>典型例</td><td>Spring / Rails / Node サーバー、API</td><td>SPA、iOS / Android、CLI</td></tr><tr><td>漏洩リスク</td><td>secret を守れば低い</td><td>コード横取り攻撃を PKCE で防御</td></tr></table><span class="trap">OFF でも Authorization Code Flow は使えるが、secret の代わりに PKCE で守る前提になる。Client Credentials Grant と Authorization Services は OFF では使えない。</span>`,
        oxIds: ['c06-ox-03', 'c06-ox-04'] },
      { id: 'c06-l01-p03', title: `token リクエストの違い(具体例)`,
        html: `<p>ON と OFF の違いは、token endpoint へのリクエストにはっきり表れる。</p><h4>ON：Basic 認証ヘッダ(client_secret_basic)</h4><pre>curl -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \\
  -u 'backend-web:s3cr3t-AbCdEf' \\
  -d grant_type=authorization_code \\
  -d code=AUTH_CODE \\
  -d redirect_uri=https://app.example.com/callback</pre><h4>ON：body に載せる方式(client_secret_post)</h4><pre>curl -X POST .../token \\
  -d client_id=backend-web -d client_secret=s3cr3t-AbCdEf \\
  -d grant_type=authorization_code -d code=AUTH_CODE \\
  -d redirect_uri=https://app.example.com/callback</pre><h4>OFF：secret なし、代わりに code_verifier</h4><pre>curl -X POST .../token \\
  -d client_id=frontend-spa \\
  -d grant_type=authorization_code -d code=AUTH_CODE \\
  -d redirect_uri=http://localhost:3000/callback \\
  -d code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk</pre><span class="trap">ON は secret を(ヘッダか body で)送る。OFF は secret を送らず、<code>code_verifier</code> を送る。</span>`,
        oxIds: ['c06-ox-05', 'c06-ox-06'] },
      { id: 'c06-l01-p04', title: `OFF で secret が無いのに、誰でも token を取れるのか`,
        html: `<p>Public client は secret を送らない。では、他人が token を取りに来たらどうなるのか。これは自然な疑問である。</p><h4>答え：3 つの条件で守られる</h4><ol><li><b class="key">code はユーザー認証後にしか出ない</b>：ログインしていない人には code が発行されない</li><li><b class="key">code は code_verifier を知る者だけが交換できる</b>(PKCE)：code を持っていても、verifier を知らなければ token に替えられない</li><li><b class="key">redirect_uri は登録 URL に限定される</b>：code は登録した URL にしか戻らない</li></ol><p>つまり、secret の代わりに、ユーザー認証・PKCE・redirect_uri の限定という複数の仕掛けで守っている。PKCE の仕組みは第7章で詳しく見る。</p><span class="trap">「secret が無い = 無防備」ではない。ただし PKCE を付けない Public client は守りが弱くなるので、<b class="key">PKCE は事実上必須</b>とされる。</span>`,
        oxIds: ['c06-ox-07', 'c06-ox-08'] }
    ] },
    { id: 'c06-l02', title: `切替の影響・エラー・選び方`, pages: [
      { id: 'c06-l02-p01', title: `ON / OFF を切り替えると起きること・よくあるエラー`,
        html: `<h4>切り替えの影響</h4><ul><li>ON → OFF：<b class="key">Credentials タブが消え</b>、Service accounts roles も使えなくなる</li><li>OFF → ON：<b class="key">secret が生成される</b>。既存アプリは secret を設定しないと <code>unauthorized_client</code> / <code>invalid_client</code> になる</li></ul><h4>よくあるエラー</h4><table><tr><th>状況</th><th>エラー</th></tr><tr><td>ON なのに secret 無し</td><td><code>{"error":"unauthorized_client","error_description":"Invalid client or Invalid client credentials"}</code></td></tr><tr><td>OFF なのに client_credentials</td><td><code>unauthorized_client</code>(&quot;Public client not allowed to retrieve service account&quot;)</td></tr><tr><td>PKCE 強制なのに challenge 無し</td><td><code>Missing parameter: code_challenge_method</code></td></tr></table><span class="trap">OFF から ON へ切り替えるだけでは、既存アプリは動かなくなる。アプリ側にも secret を設定する必要がある。エラーメッセージで、secret の問題か PKCE の問題かを見分ける。</span>`,
        oxIds: ['c06-ox-09', 'c06-ox-10'] },
      { id: 'c06-l02-p02', title: `ON / OFF の選び方フローチャート`,
        html: `<p>使う場面から ON / OFF を決めるときは、次の順に考える。</p><ul><li>ユーザーログイン不要で、サーバー間通信をする → <b class="key">ON</b> + Client Credentials</li><li>サーバー側にコードがあり、secret を隠せる Web アプリ → <b class="key">ON</b> + Authorization Code Flow</li><li>ブラウザやモバイルにコードが配布される → <b class="key">OFF</b> + Authorization Code Flow + PKCE</li><li>Backend For Frontend(BFF)構成 → <b class="key">BFF を ON</b> にし、SPA は直接 Keycloak と話さない</li><li>API(Resource Server)がトークンを検証するだけ → Client 不要、または <b class="key">bearer-only 相当</b>(v26 では ON でフロー全部 OFF)</li></ul><h4>判断の軸</h4><p>どの場合も軸は同じで、「そのコードの置き場所で、secret を隠せるか」である。隠せれば ON、配布されるなら OFF + PKCE となる。</p><span class="trap">BFF 構成では、secret を持つのは BFF(ON)であり、SPA ではない。SPA がブラウザ上の Public client として直接 Keycloak と話す構成とは別物である。</span>`,
        oxIds: ['c06-ox-11'] }
    ] }
  ],
  ox: [
    { id: 'c06-ox-01', text: `Public client(Client authentication OFF)に secret を設定しても、配布物から抜き取られるため、意味がない。`, answer: true,
      explain: `SPA やモバイルのコードはユーザーの手元に配布されるので、中の secret は<b class="key">抜き取られる</b>。そのため Public client では secret を使わない。`, lesson: 'c06-l01' },
    { id: 'c06-ox-02', text: `Client authentication の ON / OFF の本質は、ユーザーが正しいパスワードを持っているかを確認できるかどうかである。`, answer: false,
      explain: `本質は、トークンエンドポイントで<b class="key">このクライアント自身が本人だと証明できるか</b>である。証明する相手はユーザーではなく、クライアントアプリ。`, lesson: 'c06-l01' },
    { id: 'c06-ox-03', text: `Client Credentials Grant は、Client authentication が OFF の Public client でも使える。`, answer: false,
      explain: `Client Credentials Grant は Service accounts roles を使う方式で、<b class="key">ON(Confidential)でのみ</b>使える。OFF では使えない。`, lesson: 'c06-l01' },
    { id: 'c06-ox-04', text: `Public client が Authorization Code Flow を使うときは、PKCE が事実上必須となる。`, answer: true,
      explain: `Public client は secret で本人証明できないので、コード横取り攻撃を <b class="key">PKCE</b> で防ぐ前提になる。そのため PKCE は事実上必須。`, lesson: 'c06-l01' },
    { id: 'c06-ox-05', text: `Confidential client が <code>client_secret_basic</code> で token を要求するときは secret を Authorization: Basic ヘッダで送り、<code>client_secret_post</code> では body に載せる。`, answer: true,
      explain: `どちらも secret を送る方式で、送り場所が違う。<b class="key">basic はヘッダ、post は body</b>である。`, lesson: 'c06-l01' },
    { id: 'c06-ox-06', text: `Public client が token 交換をするときは、<code>client_id</code> と <code>client_secret</code> を送り、<code>code_verifier</code> は送らない。`, answer: false,
      explain: `Public client は secret を持たないので送らない。代わりに <b class="key">code_verifier</b>(PKCE の鍵)を送る。`, lesson: 'c06-l01' },
    { id: 'c06-ox-07', text: `OFF のクライアントでも誰でも token を取れるわけではない。code はユーザー認証後にしか出ず、code_verifier を知る者だけが交換できるからである。`, answer: true,
      explain: `secret が無くても、<b class="key">ユーザー認証後にしか code が出ない</b>こと、PKCE の verifier を知る者だけが交換できること、redirect_uri が限定されることで守られる。`, lesson: 'c06-l01' },
    { id: 'c06-ox-08', text: `Public client で secret が無くても code が守られるのは、code_verifier を知る者だけが交換できるためであり、redirect_uri は登録した URL に限らず任意でよい。`, answer: false,
      explain: `<b class="key">redirect_uri は登録 URL に限定される</b>。code の戻り先を限定することも、Public client の守りの 1 つである。`, lesson: 'c06-l01' },
    { id: 'c06-ox-09', text: `ON から OFF へ切り替えると Credentials タブは消えるが、Service accounts roles は引き続き使える。`, answer: false,
      explain: `OFF では Credentials タブが消えるだけでなく、<b class="key">Service accounts roles も使えなくなる</b>。Client Credentials は ON でのみ使える。`, lesson: 'c06-l02' },
    { id: 'c06-ox-10', text: `OFF のクライアントで client_credentials を要求すると、<code>unauthorized_client</code> のエラーになる。`, answer: true,
      explain: `Public client は service account のトークンを取得できない。エラーは <b class="key">unauthorized_client</b>(&quot;Public client not allowed to retrieve service account&quot;)である。`, lesson: 'c06-l02' },
    { id: 'c06-ox-11', text: `BFF 構成では BFF を ON(Confidential)にし、SPA は直接 Keycloak と話さない。`, answer: true,
      explain: `secret を隠せるサーバー側の <b class="key">BFF が ON</b> のクライアントとして Keycloak と話す。SPA は BFF とだけやり取りする。`, lesson: 'c06-l02' }
  ],
  mc: [
    { id: 'c06-mc-01', stem: `【組合せ型】Client authentication の ON / OFF に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Confidential client は、SPA やモバイルのように、secret を抜き取られる可能性があるクライアントである。` },
        { label: 'B', text: `Public client は secret を持てないため、配布物に secret を入れても抜き取られ、意味がない。` },
        { label: 'C', text: `Client authentication を OFF にすると、Credentials タブに secret が生成される。` },
        { label: 'D', text: `ON / OFF の本質は、トークンエンドポイントでクライアント自身が本人だと証明できるかである。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× SPA やモバイルは Public client(OFF)である。Confidential client は秘密を安全に保持できるクライアント。`,
        `B：○ 配布されるコードの中の secret は抜き取られるので、Public client は secret を使わない。`,
        `C：× OFF では Credentials タブが無くなる。secret が生成されるのは OFF から ON にしたとき。`,
        `D：○ 証明できる(秘密を守れる)なら ON、できないなら OFF になる。`
      ],
      tip: `ON / OFF は「ユーザーの認証」ではなく「クライアントの本人証明」。秘密を守れる場所で動くコードかどうかで決まる。` },
    { id: 'c06-mc-02', stem: `【正誤選択型】Confidential client(ON)と Public client(OFF)の違いに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'Public client でも、Client Credentials Grant を使ってトークンを取れる。',
        'Confidential client は PKCE を併用できないので、secret だけで本人証明する。',
        'Authorization Services は Confidential client では使えるが、Public client では使えない。',
        'Public client の Authorization Code Flow では、PKCE は省略しても同等に安全である。',
        'Public client では Credentials タブが表示され、そこに secret を登録する。'
      ], answer: 3,
      explain: [
        `1：× Client Credentials Grant は ON(Service accounts roles)でのみ使える。`,
        `2：× Confidential client でも PKCE は併用でき、推奨される。`,
        `3：○ 比較表のとおり、Authorization Services は ON で使え、OFF では使えない。`,
        `4：× Public client は secret が無いので、PKCE が事実上必須である。`,
        `5：× Credentials タブは ON のときだけ表示される。Public client には無い。`
      ],
      tip: `「ユーザー不在で自分を証明する機能(Client Credentials、Authorization Services)は、秘密を持てる ON 側」と整理する。` },
    { id: 'c06-mc-03', stem: `【組合せ型】token リクエストの違いに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `Confidential client が client_secret_basic を使うときは、secret を Authorization: Basic ヘッダで送る。` },
        { label: 'B', text: `Public client は、token 要求の body に client_secret を載せ、code_verifier は送らない。` },
        { label: 'C', text: `Public client は、client_id と code_verifier を送り、secret は送らない。` },
        { label: 'D', text: `client_secret_post では、secret を Authorization ヘッダに載せて送る。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ basic はヘッダ(<code>-u</code> で指定する Basic 認証)で送る方式である。`,
        `B：× Public client は secret を持たないので載せない。代わりに code_verifier を送る。`,
        `C：○ secret なしで、PKCE の鍵である code_verifier を送って code を交換する。`,
        `D：× post は body に載せる方式である。ヘッダで送るのは basic。`
      ],
      tip: `ON は「secret を送る(basic はヘッダ、post は body)」、OFF は「secret の代わりに code_verifier」。` },
    { id: 'c06-mc-04', stem: `【正誤選択型】切り替えとエラーに関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'OFF のクライアントで client_credentials を要求すると、unauthorized_client になる。',
        'ON なのに secret を付けずに要求すると、Missing parameter: code_challenge_method になる。',
        'PKCE を強制しているのに challenge が無いと、Invalid client credentials になる。',
        'ON から OFF へ切り替えても、Service accounts roles は使い続けられる。',
        'OFF から ON へ切り替えても secret は生成されず、既存アプリはそのまま動く。'
      ], answer: 1,
      explain: [
        `1：○ Public client は service account のトークンを取得できず、<code>unauthorized_client</code> になる。`,
        `2：× secret 無しの場合は <code>unauthorized_client</code>(Invalid client or Invalid client credentials)。code_challenge_method のエラーは PKCE 強制のときに出る。`,
        `3：× challenge が無いときのエラーは <code>Missing parameter: code_challenge_method</code> である。`,
        `4：× OFF にすると Service accounts roles も使えなくなる。`,
        `5：× OFF から ON にすると secret が生成され、既存アプリは secret を設定しないと動かない。`
      ],
      tip: `エラー文言から原因を逆引きする。「credentials」は secret の問題、「code_challenge」は PKCE の問題。` },
    { id: 'c06-mc-05', stem: `【組合せ型】Client authentication の選び方に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `ユーザーログイン不要でサーバー間通信をする場合は、OFF にして PKCE を併用する。` },
        { label: 'B', text: `ブラウザやモバイルにコードが配布される場合は、ON にして secret をコードに埋め込む。` },
        { label: 'C', text: `サーバー側にコードがあり secret を隠せる Web アプリは、ON にして Authorization Code Flow を使う。` },
        { label: 'D', text: `BFF 構成では、BFF を ON にし、SPA は直接 Keycloak と話さない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× サーバー間通信は ON + Client Credentials。OFF では Client Credentials を使えない。`,
        `B：× コードが配布されるなら OFF + Authorization Code Flow + PKCE。配布物の secret は抜き取られる。`,
        `C：○ secret を隠せるサーバー側のコードなので、secret で本人証明できる。`,
        `D：○ secret を持つのは BFF(ON)で、SPA は Keycloak と直接話さない。`
      ],
      tip: `判断の軸は「そのコードがどこで動き、secret を隠せるか」。隠せれば ON、配布されるなら OFF + PKCE。` },
    { id: 'c06-mc-06', stem: `【正誤選択型】Public client(OFF)が secret 無しでも、誰でも token を取れるわけではない理由として、正しいものはどれか。`,
      items: [],
      choices: [
        'code はログイン前から発行されるが、Keycloak が送信元の IP アドレスで判別するから。',
        'code は誰でも交換できるが、有効期限が極めて短いため、実質的に悪用できないから。',
        'code はユーザー認証後にしか出ず、code_verifier を知る者だけが交換でき、redirect_uri も登録 URL に限られるから。',
        'redirect_uri は任意だが、Keycloak が code_challenge を毎回無視して安全に処理するから。',
        'Public client は token を取得できないので、secret の有無は問題にならないから。'
      ], answer: 3,
      explain: [
        `1：× code はユーザー認証後にしか出ない。また IP アドレスによる判別は本文で述べられていない。`,
        `2：× 守りの理由は有効期限ではなく、ユーザー認証・PKCE・redirect_uri の限定である。`,
        `3：○ secret の代わりに、これら 3 つの条件で守られている。`,
        `4：× redirect_uri は登録 URL に限定される。code_challenge も無視されず、code_verifier との照合に使われる。`,
        `5：× Public client も Authorization Code Flow で token を取得できる(PKCE 必須級)。`
      ],
      tip: `secret が無い代わりに「認証後にしか出ない code」「verifier を知る者だけ」「戻り先の限定」の三重の守りがある。` }
  ]
});

DATA.chapters.push({
  no: 7, title: `フローの前提: アプリ種別・state・nonce・PKCE`,
  lessons: [
    { id: 'c07-l01', title: `3つのアプリ(SPA・Web・API)の違い`, pages: [
      { id: 'c07-l01-p01', title: `前提値と、登場する3つのアプリ`,
        html: `<p>これ以降のフロー解説では、次の値と 3 つのアプリを前提にする。</p><h4>前提値</h4><ul><li>Keycloak：<code>http://localhost:8080</code>、realm：<code>myrealm</code></li><li>SPA client：<code>frontend-spa</code>(Client authentication OFF)</li><li>Web client：<code>backend-web</code>(Client authentication ON、secret=<code>s3cr3t</code>)</li><li>API：<code>backend-api</code></li></ul><h4>3つの部品(たとえ話)</h4><p>社内の「経費精算システム」を、3 つの部品で作っているとする。<code>frontend-spa</code> はブラウザで動く画面だけのアプリ(React など)、<code>backend-web</code> はサーバーが画面も作って返す Web アプリ(Spring MVC、Rails、Express など)、<code>backend-api</code> は画面を持たず、データだけを JSON で返す API サーバーである。</p><table><tr><th>項目</th><th>frontend-spa</th><th>backend-web</th><th>backend-api</th></tr><tr><td>コードの置き場所</td><td><b class="key">ユーザーのブラウザ</b></td><td><b class="key">自社サーバー</b></td><td>自社サーバー</td></tr><tr><td>secret を隠せる?</td><td>✕(JS は丸見え)</td><td>○</td><td>○</td></tr><tr><td>Client authentication</td><td>OFF(Public)</td><td>ON(Confidential)</td><td>用途次第</td></tr><tr><td>ログイン画面</td><td>出す(Keycloak へ転送)</td><td>出す(Keycloak へ転送)</td><td><b class="key">出さない</b></td></tr><tr><td>使うフロー</td><td>Auth Code + PKCE</td><td>Auth Code(+ PKCE 推奨)</td><td>フローは使わない</td></tr></table>`,
        oxIds: ['c07-ox-01', 'c07-ox-02'] },
      { id: 'c07-l01-p02', title: `frontend-spa と backend-web の違い(一番の疑問点)`,
        html: `<p>どちらも「ユーザーをログインさせるアプリ」で、使うフローは同じ Authorization Code Flow である。では何が違うのか。</p><h4>違いは「コードがどこで動くか」だけ</h4><ul><li>SPA：コードごとユーザーに配布される → secret を書いても抜かれる → <b class="key">secret なし + PKCE</b> で守る</li><li>Web：コードは自社サーバー内 → secret を安全に持てる → <b class="key">secret で本人証明</b>する</li></ul><h4>その結果、token endpoint へのリクエストが変わる</h4><ul><li>SPA：<code>client_id</code> + <code>code_verifier</code>(secret なし)</li><li>Web：<code>client_id</code> + <b class="key">client_secret</b>(+ 任意で <code>code_verifier</code>)</li></ul><h4>トークンの置き場所も違う</h4><ul><li>SPA：ブラウザのメモリ等に保持する(XSS で盗まれるリスクがある)</li><li>Web：<b class="key">サーバーのセッションに保存</b>し、ブラウザには Cookie だけ渡す(安全)</li></ul><span class="trap">「SPA は Implicit、Web は Authorization Code」という違いではない。どちらも Authorization Code Flow で、違うのは secret を持てるか(コードの置き場所)である。</span>`,
        oxIds: ['c07-ox-03', 'c07-ox-04'] },
      { id: 'c07-l01-p03', title: `backend-web と backend-api の違い・全体の流れ`,
        html: `<h4>ログインさせる側と、トークンを受け取る側</h4><ul><li><code>backend-web</code> ＝ <b class="key">ログインをさせる側</b>(ユーザーと直接やり取りする)</li><li><code>backend-api</code> ＝ <b class="key">トークンを受け取る側</b>(ユーザーとは話さず、渡された Access Token を検証して JSON を返すだけ)</li><li>名前に backend が付くが役割は別で、Keycloak 上の登録も別</li></ul><h4><code>backend-api</code> を Keycloak に登録する理由</h4><ol><li><b class="key">aud の宛先</b>として名前が必要(Audience Mapper で <code>backend-api</code> を指定する)</li><li><b class="key">Client Role</b>(<code>read</code>、<code>write</code>)の置き場所にする</li><li><b class="key">introspection</b> を呼ぶときの認証用(この場合は Client auth ON + secret)</li></ol><p>ログインは行わないので、フロー(Standard flow 等)は全部 OFF でよい。</p><h4>全体の流れ</h4><pre>SPA + API の場合
ユーザー ─ログイン→ frontend-spa ──Keycloakでログイン──&gt; Keycloak
                        │  (azp=frontend-spa, aud=backend-api の token を受け取る)
                        └─ Bearer token ─&gt; backend-api ─(署名・iss・aud検証)→ JSON返却

サーバーサイド Web + API の場合
ブラウザ ─&gt; backend-web (secret で Keycloak から token 取得、サーバーに保存)
                └─ Bearer token ─&gt; backend-api</pre>`,
        oxIds: ['c07-ox-05', 'c07-ox-06'] }
    ] },
    { id: 'c07-l02', title: `用語整理と state`, pages: [
      { id: 'c07-l02-p01', title: `フローに出てくる用語を先に整理する`,
        html: `<p>第8章の Authorization Code Flow を読む前に、登場キーワードを「何のために・誰が作り・誰が確認するか」で整理しておく。</p><table><tr><th>用語</th><th>一言でいうと</th><th>作る人</th><th>確認する人</th><th>守る相手</th></tr><tr><td><b class="key">state</b></td><td>リクエストと応答の引換番号</td><td>アプリ</td><td>アプリ</td><td>CSRF</td></tr><tr><td><b class="key">nonce</b></td><td>ID Token の使い回し防止の合言葉</td><td>アプリ</td><td>アプリ</td><td>ID Token のリプレイ</td></tr><tr><td><b class="key">PKCE</b></td><td>code の横取り対策の鍵と錠</td><td>アプリ</td><td>Keycloak</td><td>code を盗まれる</td></tr><tr><td>JWT</td><td>情報を入れた署名付きの書類</td><td>Keycloak</td><td>API・アプリ</td><td>改ざん</td></tr><tr><td>JWS / kid / JWKS</td><td>書類に押す印鑑と印鑑証明</td><td>Keycloak</td><td>API・アプリ</td><td>偽造</td></tr><tr><td>Bearer token</td><td>持っている人が使える入場券</td><td>Keycloak</td><td>API</td><td>(盗まれると悪用される)</td></tr><tr><td>Introspection</td><td>券が今も有効かの問い合わせ窓口</td><td>Keycloak</td><td>API</td><td>失効後の悪用</td></tr></table><h4>第8章のどこで出てくるか</h4><ul><li>手順 2：PKCE の <code>code_verifier</code> / <code>code_challenge</code> を作る</li><li>手順 3：認可リクエストに <code>state</code> / <code>nonce</code> / <code>code_challenge</code> を付ける</li><li>手順 5：戻りの URL の <code>state</code> を照合する</li><li>手順 6〜7：token 交換で <code>code_verifier</code> を送り、Keycloak が PKCE を検証する</li></ul><p>この章では、このうち state・nonce・PKCE を順に取り上げる。</p>`,
        oxIds: ['c07-ox-07'] },
      { id: 'c07-l02-p02', title: `state(1)：CSRF と、state が無いときの攻撃`,
        html: `<p>先に結論から。state は、<b class="key">「今ブラウザに戻ってきたこのレスポンスは、自分が出したログインの結果か?」</b>をアプリが確かめるための番号札である。</p><h4>CSRF とは</h4><p>Cross-Site Request Forgery。罪のない人のブラウザに、攻撃者が用意したリクエストを実行させる攻撃である。ここでは「攻撃者が作ったログイン完了 URL を被害者に踏ませる」形(Login CSRF)で起きる。</p><h4>攻撃シナリオ(state が無い場合)</h4><p>登場人物は、攻撃者 Eve、被害者 Taro、経費アプリ(<code>https://app.example.com</code>)。</p><ol><li>Eve が<b class="key">自分のアカウント</b>で経費アプリにログインを始め、Keycloak でログインする</li><li>Keycloak が Eve のブラウザを下の URL に戻す。Eve はこの URL を<b class="key">開かずに止めて</b>、URL だけ控える(code は未使用)</li><li>Eve が Taro にこの URL を、メール・SNS・画像タグなどで踏ませる</li><li>アプリは「code が来た」としか分からず、そのまま token に交換する</li><li>Taro のブラウザは、Eve のアカウントでログインした状態になる</li><li>Taro は気づかず、領収書の写真・カード・個人情報を入力する → それらは<b class="key">Eve のアカウントに保存</b>される</li></ol><pre>https://app.example.com/callback?code=EVE-CODE-123</pre><span class="trap">問題は、アプリに「自分が出したログインの結果かどうか」を確認する手段が無いこと。他人(Eve)の家の鍵を渡され、自分の家だと思い込んだまま荷物を置いてくるようなものである。</span>`,
        oxIds: ['c07-ox-08', 'c07-ox-09'] },
      { id: 'c07-l02-p03', title: `state(2)：解決策と PKCE との違い`,
        html: `<h4>解決策：state</h4><ol><li>Taro が正規にログインを始めるとき、アプリが<b class="key">ランダムな値</b>を作る(例 <code>state=abc123</code>)</li><li>その値を Taro の<b class="key">ブラウザのセッション</b>(Cookie や sessionStorage)に保存する</li><li>認可リクエストの URL に <code>state=abc123</code> を付ける</li><li>Keycloak は何も加工せず、戻りの URL にそのまま付ける</li><li>アプリは、戻ってきた state とセッションに保存した値を<b class="key">比較</b>する。一致なら続行、不一致または state なしなら<b class="key">破棄してエラー</b></li></ol><pre>https://app.example.com/callback?code=...&amp;state=abc123</pre><h4>同じ攻撃が state ありだとどうなるか</h4><p>Eve の URL は <code>callback?code=EVE-CODE-123&amp;state=eve-state-999</code> である。Taro のセッションにあるのは <code>abc123</code>(または何も無い)ので、不一致でアプリが拒否する。Eve は Taro のセッションの中身を読めないため、一致する値を用意できない。</p><h4>PKCE との違い</h4><ul><li>state ＝ 戻ってきたレスポンスが<b class="key">自分宛か</b>を確かめる(アプリが照合)</li><li>PKCE ＝ code を盗んだ人が token に交換できないようにする(Keycloak が照合)</li></ul><span class="trap">state は付けるだけでは何も守れない。ブラウザのセッションに保存した値と、戻りで照合して初めて意味を持つ。守るものが別なので、state と PKCE は両方使う。</span>`,
        oxIds: ['c07-ox-10', 'c07-ox-11'] },
      { id: 'c07-l02-p04', title: `state(3)：「URL に付くのに、盗まれたら無意味では?」`,
        html: `<p>疑問：state は URL に付くのだから、途中で盗まれたら意味がないのでは?</p><p>答え：<b class="key">その通り。盗まれると防御は破れる。ただし state が想定している攻撃者は、それができない相手</b>である。</p><h4>CSRF の攻撃者 Eve の能力</h4><ul><li>できる：Taro にリンクを踏ませる(リクエストを送らせる)</li><li>できない：Taro のブラウザの通信やセッションの中身を見る</li></ul><p>だから Eve は、Taro のセッションに保存された <code>abc123</code> を知らず、一致する値を作れない。</p><h4>URL に出ても大丈夫な理由</h4><ul><li>HTTPS なので、通信経路では盗聴されない</li><li>パスワードではなく<b class="key">1回限りの照合用の値</b>で、完了時に照合して破棄(使い捨て)する</li><li>有効期間が短い(ログイン開始から完了までの数分)</li></ul><h4>破れるケースと、さらに守る方法</h4><p>悪意ある拡張機能・XSS・同一端末のマルウェアなどで、ログイン進行中に URL をリアルタイムで読まれると、state は突破される。ただしその攻撃者はブラウザを掌握済みで、state の守備範囲外である。</p><p>さらに守るのが <b class="key">PKCE</b> で、<code>code_verifier</code>(鍵)は URL に出ない。Eve の code は Eve の challenge に結び付いており、Taro のアプリが送る verifier と合わず、Keycloak が拒否する。つまり PKCE は<b class="key">CSRF 対策としても働く</b>。</p><span class="trap">OAuth 2.1 などでは PKCE を正しく使えば CSRF 対策として足りるとされるが、state も併用するのが実務の定番である。state は軽い照合札、本命は PKCE と覚える。</span>`,
        oxIds: ['c07-ox-12', 'c07-ox-13'] }
    ] },
    { id: 'c07-l03', title: `nonce`, pages: [
      { id: 'c07-l03-p01', title: `nonce(1)：リプレイ攻撃と、nonce が無いときの問題`,
        html: `<p>先に結論から。nonce は、<b class="key">「この ID Token は、今回自分が始めたログインのために作られたものか?」</b>をアプリが確かめるための合言葉である。名前の由来は "number used once"(1回だけ使う数)。</p><h4>用語：リプレイ</h4><p>リプレイ(replay)とは、過去に正規に発行された<b class="key">有効なトークンを、別の場面で使い回す</b>攻撃である。</p><h4>攻撃シナリオ(nonce が無い場合)</h4><ol><li>以前 Taro がログインしたときの <b class="key">ID Token が Eve に漏れる</b>(ログやプロキシの記録、メールに貼られたデバッグ出力、古いブラウザ履歴、サーバーの不備など)。署名は本物で、<code>exp</code> が切れる前なら検証を通ってしまう</li><li>Eve が自分のブラウザで経費アプリのログイン処理に入り込み、その ID Token をアプリに差し込む(トークンが URL に載る Implicit / Hybrid Flow で成立しやすい)</li><li>アプリは「署名 OK、<code>iss</code> OK、<code>aud</code> OK、<code>exp</code> OK」と判断する</li><li>Eve が Taro としてログインした状態になる</li></ol><pre>{ "iss": "http://localhost:8080/realms/myrealm", "aud": "frontend-spa",
  "sub": "taro-uuid", "preferred_username": "taro", "exp": 1760003600 }</pre><span class="trap">署名・iss・aud・exp が示すのは「本物のトークンか」だけである。「今回のログインの結果か」は示さない。ここが nonce の存在理由になる。</span>`,
        oxIds: ['c07-ox-14', 'c07-ox-15'] },
      { id: 'c07-l03-p02', title: `nonce(2)：解決策と state との違い`,
        html: `<h4>解決策：nonce</h4><ol><li>アプリはログインを始めるとき、<b class="key">ログインごとに新しいランダム値</b>を作る(例 <code>nonce=n-0S6_WzA2Mj</code>)</li><li>その値をブラウザのセッションに保存し、認可リクエストに付ける</li><li>Keycloak はこの値を、<b class="key">ID Token の中に nonce claim として埋め込み、署名</b>する</li><li>アプリは ID Token の検証時に、nonce が保存した値と一致するか確認する。一致なら受け入れ、不一致または nonce なしなら<b class="key">拒否</b></li></ol><pre>GET /auth?client_id=frontend-spa&amp;response_type=code&amp;scope=openid&amp;nonce=n-0S6_WzA2Mj&amp;...</pre><h4>同じ攻撃が nonce ありだとどうなるか</h4><p>Eve が差し込むのは過去のログインで作られたトークンで、その nonce は過去の値(例 <code>old-nonce-111</code>)である。今回のセッションには <code>n-0S6_WzA2Mj</code> が保存されているので、不一致で拒否される。Eve は nonce を書き換えられない(書き換えると署名が壊れる)。</p><h4>state との違い</h4><table><tr><th>項目</th><th>state</th><th>nonce</th></tr><tr><td>守る対象</td><td>戻りの URL(リダイレクト)</td><td>ID Token</td></tr><tr><td>どこに入る</td><td>URL の <code>state=</code></td><td>ID Token の <code>nonce</code> claim(署名される)</td></tr><tr><td>照合する場所</td><td>コールバックを受けたとき</td><td>ID Token を検証するとき</td></tr><tr><td>防ぐもの</td><td>他人が作ったログイン完了 URL を踏まされる(CSRF)</td><td>古い・他人のトークンを差し込まれる(リプレイ)</td></tr></table>`,
        oxIds: ['c07-ox-16', 'c07-ox-17'] },
      { id: 'c07-l03-p03', title: `nonce(3)：Authorization Code Flow での位置づけと確かめ方`,
        html: `<h4>署名されていることが重要</h4><p>nonce は<b class="key">署名された ID Token の中</b>に入っているので、途中で差し替えられない。state は URL に付くだけで署名されていない。両者の守り方は違う。</p><h4>Authorization Code Flow での位置づけ</h4><ul><li>ID Token が <code>/token</code> から<b class="key">直接 HTTPS で返る</b>ため、URL に載る方式より盗まれにくい</li><li>仕様上、nonce が<b class="key">必須なのは Implicit / Hybrid</b>。Authorization Code Flow では<b class="key">任意だが推奨</b></li><li>実際のライブラリ(<code>oidc-client</code>、Spring Security、NextAuth 等)は、通常、自動で付けて検証する</li><li>付けておけば追加の防御になり、コストはほぼ無いので、付けるのが定石</li></ul><h4>手で確かめる</h4><ul><li>第16章の Step 4 の URL に <code>nonce=n-0S6_WzA2Mj</code> が入っている</li><li>Step 5 で ID Token を decode して、<code>"nonce": "n-0S6_WzA2Mj"</code> が入っているのを確認する</li><li>別の値で認可リクエストを出し直すと、ID Token の nonce もその値に変わる(<b class="key">ログインごとに変わる</b>)</li></ul><span class="trap">「Authorization Code Flow なら nonce は不要」ではない。必須でないだけで、付けて検証するのが定石である。必須なのは Implicit / Hybrid の方。</span>`,
        oxIds: ['c07-ox-18'] }
    ] },
    { id: 'c07-l04', title: `PKCE`, pages: [
      { id: 'c07-l04-p01', title: `PKCE(1)：code の横取りと、PKCE が無いときの攻撃`,
        html: `<p>先に結論から。PKCE(ピクシー)は、<b class="key">「code を盗んでも、最初にログインを始めた本人(アプリ)でなければ token に交換できない」</b>ようにする仕組みである。正式名は Proof Key for Code Exchange(RFC 7636)。</p><h4>前提</h4><p>code は<b class="key">ブラウザの URL を経由して戻ってくる</b>。つまり URL が見える場所(ブラウザ履歴、ログ、Referer、同じ端末の別アプリ、拡張機能)では盗まれうる。</p><h4>攻撃シナリオ(PKCE が無い Public client)</h4><ol><li>Eve が、Taro のスマホに悪意あるアプリを入れさせる。このアプリも経費アプリと<b class="key">同じリダイレクト先</b>(<code>myapp://callback</code>)を宣言する</li><li>Taro が経費アプリでログインし、Keycloak が <code>myapp://callback?code=TARO-CODE</code> へ戻す</li><li>OS が、同じスキームを宣言した複数のアプリのうち<b class="key">悪意あるアプリに URL を渡して</b>しまうことがある</li><li>Eve が code を手に入れ、token endpoint に下のように送る</li><li>Public client は secret が無いので、Keycloak は本人確認の材料を持たず、そのまま token を発行する</li></ol><pre>POST /token
  grant_type=authorization_code
  client_id=frontend-spa
  code=TARO-CODE
  redirect_uri=myapp://callback</pre><span class="trap">問題の本質は「code さえ持っていれば誰でも交換できる」こと。code を持つ人が正規のアプリかどうかを Keycloak が判断できない。同様の横取りは、モバイルに限らず Web でも起こる。</span>`,
        oxIds: ['c07-ox-19', 'c07-ox-20'] },
      { id: 'c07-l04-p02', title: `PKCE(2)：鍵と錠のしくみ`,
        html: `<h4>解決策：鍵と錠のたとえ</h4><ol><li>アプリはログインのたびに、秘密の乱数 <b class="key">code_verifier(鍵)</b>を作り、自分の中にだけ保存する(例 <code>dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk</code>)</li><li>鍵のハッシュ <b class="key">code_challenge(錠)</b>を計算し、認可リクエストに付けて Keycloak に渡す。<code>code_challenge = BASE64URL( SHA256( code_verifier ) )</code>。<code>code_challenge_method=S256</code> はハッシュ方式の指定</li><li>Keycloak は錠(challenge)を code に結び付けて記憶する</li><li>ログイン後、code がアプリに戻る(従来と同じ。盗まれる可能性がある)</li><li>アプリは token 交換のとき、<b class="key">鍵(code_verifier)そのもの</b>を <code>/token</code> に送る</li><li>Keycloak は鍵を SHA-256 でハッシュし、記憶していた錠と一致するか確認する。一致なら token を発行、不一致なら <code>invalid_grant</code>(&quot;PKCE verification failed&quot;)</li></ol><h4>同じ攻撃が PKCE ありだとどうなるか</h4><p>Eve が盗めたのは <code>code</code>(と URL に出ていた <code>code_challenge</code>)だけで、<code>code_verifier</code> を知らない。SHA-256 は一方向なので、錠から鍵を逆算することはできない。Eve の交換リクエストは不一致で拒否される。</p>`,
        oxIds: ['c07-ox-21', 'c07-ox-22'] },
      { id: 'c07-l04-p03', title: `PKCE(3)：S256 の必要性と、client secret との違い`,
        html: `<h4>通信の中での鍵の動き</h4><table><tr><th>段階</th><th>経路</th><th>code_challenge(錠)</th><th>code_verifier(鍵)</th></tr><tr><td>認可リクエスト</td><td>ブラウザ経由(URL)</td><td>出る</td><td><b class="key">出ない</b></td></tr><tr><td>code が戻る</td><td>ブラウザ経由(URL)</td><td>-</td><td><b class="key">出ない</b></td></tr><tr><td>token 交換</td><td>アプリ → Keycloak(直接 HTTPS)</td><td>-</td><td>ここで初めて送る</td></tr></table><h4>なぜ S256(ハッシュ)が必要か</h4><p><code>code_challenge_method=plain</code> は challenge が verifier そのままなので、認可リクエスト(URL)を見られると鍵が丸見えになり、意味がない。必ず <b class="key">S256</b> を使う。</p><h4>手元で確かめる</h4><pre>printf 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk' | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='
# =&gt; E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</pre><h4>client secret との違い</h4><table><tr><th>項目</th><th>client secret</th><th>PKCE</th></tr><tr><td>何を証明するか</td><td>このクライアントアプリ(種類)が本物</td><td>このログインを始めた個体が今の送信者</td></tr><tr><td>値の寿命</td><td>固定(長期間同じ)</td><td><b class="key">ログインごとの使い捨て</b></td></tr><tr><td>Public client で使える?</td><td>✕(隠せない)</td><td>○</td></tr><tr><td>盗まれたら</td><td>全ログインに影響</td><td>その 1 回のログインだけ</td></tr></table><p>Confidential client でも PKCE の併用が推奨される(OAuth 2.1 では全クライアントで必須)。</p>`,
        oxIds: ['c07-ox-23'] },
      { id: 'c07-l04-p04', title: `PKCE(4)：state・nonce との三つ組と Keycloak の設定`,
        html: `<h4>state / nonce / PKCE の整理</h4><table><tr><th></th><th>守る対象</th><th>攻撃の例</th><th>照合するのは</th></tr><tr><td><b class="key">state</b></td><td>戻りの URL</td><td>他人が作ったログイン完了 URL を踏まされる</td><td>アプリ</td></tr><tr><td><b class="key">nonce</b></td><td>ID Token</td><td>古い・他人のトークンを差し込まれる</td><td>アプリ</td></tr><tr><td><b class="key">PKCE</b></td><td>code</td><td>盗んだ code を token に交換される</td><td><b class="key">Keycloak</b></td></tr></table><h4>Keycloak での設定</h4><ul><li>Clients → 対象 → Advanced タブ → <b class="key">Proof Key for Code Exchange Code Challenge Method</b> = <code>S256</code></li><li>設定すると、PKCE が付いていないリクエストは <code>Missing parameter: code_challenge_method</code> で<b class="key">拒否</b>される</li></ul><h4>一言でまとめると</h4><p>PKCE は「code を盗まれても、鍵を持つ本人しか交換できない」ようにする仕組みである。</p><span class="trap">3 つはそれぞれ守る対象が違う(URL・ID Token・code)。どれか 1 つで他の代わりにはならないので、必要に応じて併用する。</span>`,
        oxIds: ['c07-ox-24'] }
    ] }
  ],
  ox: [
    { id: 'c07-ox-01', text: `frontend-spa は Client authentication OFF の Public client である。ブラウザに配布される JS は secret を隠せないためである。`, answer: true,
      explain: `SPA のコードは<b class="key">ユーザーのブラウザ</b>で動き、JS は丸見えなので secret を隠せない。そのため OFF(Public)にする。`, lesson: 'c07-l01' },
    { id: 'c07-ox-02', text: `backend-api は、ログイン画面を Keycloak へ転送して表示する側のアプリである。`, answer: false,
      explain: `<b class="key">backend-api はログイン画面を出さない</b>。ユーザーとは話さず、渡された Access Token を検証して JSON を返す。ログイン画面を出すのは frontend-spa と backend-web。`, lesson: 'c07-l01' },
    { id: 'c07-ox-03', text: `frontend-spa と backend-web の違いは、前者が Implicit flow、後者が Authorization Code Flow を使う点にある。`, answer: false,
      explain: `どちらも Authorization Code Flow である。違いは<b class="key">コードがどこで動くか</b>だけで、secret を安全に持てるかが変わる。`, lesson: 'c07-l01' },
    { id: 'c07-ox-04', text: `backend-web はトークンをサーバーのセッションに保存し、ブラウザには Cookie だけを渡すので、SPA よりトークンが漏れにくい。`, answer: true,
      explain: `Web アプリのコードは自社サーバー内にあるため、<b class="key">サーバーのセッションにトークンを保存</b>できる。SPA はブラウザ側に持つので XSS のリスクがある。`, lesson: 'c07-l01' },
    { id: 'c07-ox-05', text: `backend-api を Keycloak に登録する理由には、aud の宛先としての名前、Client Role の置き場所、introspection を呼ぶときの認証用がある。`, answer: true,
      explain: `API 自体はログインしないが、<b class="key">aud の宛先</b>、<b class="key">Client Role の置き場所</b>、<b class="key">introspection の認証用</b>として Keycloak 上の登録が必要になる。`, lesson: 'c07-l01' },
    { id: 'c07-ox-06', text: `backend-api はログインを行うため、Keycloak 上では Standard flow を ON にしておく必要がある。`, answer: false,
      explain: `backend-api は<b class="key">ログインを行わない</b>ので、フロー(Standard flow 等)は全部 OFF でよい。ログインさせる側は backend-web である。`, lesson: 'c07-l01' },
    { id: 'c07-ox-07', text: `state の照合はアプリが行い、PKCE の code_challenge / code_verifier の照合は Keycloak が行う。`, answer: true,
      explain: `state は「アプリが作り、アプリが確認」する。<b class="key">PKCE はアプリが作り、Keycloak が確認</b>する。確認する人が違う。`, lesson: 'c07-l02' },
    { id: 'c07-ox-08', text: `state が無いと、Eve が自分のアカウントで得た code 付きの URL を Taro に踏ませることで、Taro のブラウザを Eve のアカウントでログインした状態にできる。`, answer: true,
      explain: `アプリは「自分が出したログインの結果か」を確認できず、code をそのまま token に交換してしまう。これが <b class="key">Login CSRF</b> である。`, lesson: 'c07-l02' },
    { id: 'c07-ox-09', text: `この攻撃が成立すると、Taro が入力した領収書や個人情報は、Taro 自身のアカウントに保存される。`, answer: false,
      explain: `Taro のブラウザは <b class="key">Eve のアカウント</b>でログインした状態になっているので、入力した情報は Eve のアカウントに保存され、Eve に見られてしまう。`, lesson: 'c07-l02' },
    { id: 'c07-ox-10', text: `戻ってきた state が保存した値と一致しなくても、code が有効であれば、アプリは処理を続けてよい。`, answer: false,
      explain: `不一致、または state なしの場合は、<b class="key">破棄してエラー</b>にする。code が有効かどうかとは別に、state の照合で「自分が出したログインか」を確かめる。`, lesson: 'c07-l02' },
    { id: 'c07-ox-11', text: `state は、ブラウザのセッションに保存した値と戻りの値を照合して初めて意味を持ち、付けるだけでは何も守れない。`, answer: true,
      explain: `<b class="key">照合しないと意味がない</b>。ユーザーのブラウザのセッションに保存し、戻りで比較することが肝心である。`, lesson: 'c07-l02' },
    { id: 'c07-ox-12', text: `state が CSRF 対策になるのは、攻撃者 Eve が Taro のブラウザの通信やセッションの中身を見られることを前提に設計されているからである。`, answer: false,
      explain: `前提は逆で、Eve は Taro に<b class="key">リンクを踏ませる</b>ことはできるが、通信やセッションの中身は<b class="key">見られない</b>。だから保存された値と一致する state を用意できない。`, lesson: 'c07-l02' },
    { id: 'c07-ox-13', text: `PKCE の code_verifier は URL に出ないので、PKCE は CSRF 対策としても働く。`, answer: true,
      explain: `Eve の code は Eve の challenge に結び付いており、Taro のアプリが送る verifier と合わない。<b class="key">PKCE は CSRF 対策としても働く</b>。`, lesson: 'c07-l02' },
    { id: 'c07-ox-14', text: `nonce が無いと、過去に正規に発行されて署名も正しい ID Token を差し込まれても、署名・iss・aud・exp の検証を通ってしまう。`, answer: true,
      explain: `これらの検証は<b class="key">本物のトークンか</b>しか示さない。今回のログインのものかは分からないので、リプレイが成立する。`, lesson: 'c07-l03' },
    { id: 'c07-ox-15', text: `署名・iss・aud・exp の検証に通れば、その ID Token が今回のログインの結果であることも保証される。`, answer: false,
      explain: `これらが示すのは「本物のトークンか」だけである。<b class="key">今回のログインの結果か</b>を確かめるのが nonce の役割。`, lesson: 'c07-l03' },
    { id: 'c07-ox-16', text: `nonce は ID Token の中に nonce claim として埋め込まれて署名されるので、攻撃者が書き換えると署名が壊れる。`, answer: true,
      explain: `Keycloak は nonce を ID Token に埋め込んで<b class="key">署名</b>する。書き換えると署名が壊れるので、Eve は nonce を差し替えられない。`, lesson: 'c07-l03' },
    { id: 'c07-ox-17', text: `nonce は戻りの URL を守る値であり、state は ID Token を守る値である。`, answer: false,
      explain: `逆である。<b class="key">state が戻りの URL</b>、<b class="key">nonce が ID Token</b> を守る。nonce は署名された ID Token の claim、state は署名されない URL の値。`, lesson: 'c07-l03' },
    { id: 'c07-ox-18', text: `nonce は Authorization Code Flow では必須であり、Implicit / Hybrid Flow では任意である。`, answer: false,
      explain: `逆で、nonce が<b class="key">必須なのは Implicit / Hybrid</b>、Authorization Code Flow では<b class="key">任意だが推奨</b>である。付けるコストはほぼ無い。`, lesson: 'c07-l03' },
    { id: 'c07-ox-19', text: `PKCE が無い Public client では、盗まれた code を持つ人は誰でも token に交換でき、Keycloak は送信者が正規のアプリかどうかを判断できない。`, answer: true,
      explain: `Public client は secret が無く、本人確認の材料が無い。<b class="key">code さえ持っていれば誰でも交換できる</b>ことが問題の本質である。`, lesson: 'c07-l04' },
    { id: 'c07-ox-20', text: `code は token endpoint への直接通信だけで届くので、URL から盗まれることはない。`, answer: false,
      explain: `code は<b class="key">ブラウザの URL を経由して戻ってくる</b>。そのため、ブラウザ履歴、ログ、Referer、同じ端末の別アプリ、拡張機能などで盗まれうる。`, lesson: 'c07-l04' },
    { id: 'c07-ox-21', text: `アプリは、認可リクエストに code_verifier そのものを付け、token 交換のときに code_challenge を送る。`, answer: false,
      explain: `逆である。認可リクエストに付けるのは<b class="key">ハッシュの code_challenge(錠)</b>、token 交換で送るのは<b class="key">code_verifier(鍵)そのもの</b>。鍵は URL に出ない。`, lesson: 'c07-l04' },
    { id: 'c07-ox-22', text: `Keycloak は token 交換で受け取った code_verifier を SHA-256 でハッシュし、記憶していた code_challenge と一致しなければ、token を発行しない。`, answer: true,
      explain: `不一致なら <code>invalid_grant</code>(&quot;PKCE verification failed&quot;)となる。Eve は verifier を知らず、<b class="key">錠から鍵を逆算</b>することもできない。`, lesson: 'c07-l04' },
    { id: 'c07-ox-23', text: `client secret はログインごとの使い捨てだが、PKCE の code_verifier は固定で長期間同じ値を使う。`, answer: false,
      explain: `逆である。<b class="key">client secret が固定(長期間同じ)</b>で、<b class="key">PKCE がログインごとの使い捨て</b>。だから PKCE が盗まれても影響は 1 回のログインだけ。`, lesson: 'c07-l04' },
    { id: 'c07-ox-24', text: `Advanced タブで PKCE Method を S256 に設定すると、PKCE が付いていないリクエストは <code>Missing parameter: code_challenge_method</code> で拒否される。`, answer: true,
      explain: `<b class="key">S256</b> を設定すると PKCE が強制され、challenge の無いリクエストは拒否される。`, lesson: 'c07-l04' }
  ],
  mc: [
    { id: 'c07-mc-01', stem: `【組合せ型】frontend-spa・backend-web・backend-api の違いに関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `frontend-spa と backend-web の違いはコードがどこで動くかであり、SPA はコードごとユーザーに配布されるので secret を隠せない。` },
        { label: 'B', text: `frontend-spa と backend-web は使うフローが異なり、backend-web だけが Authorization Code Flow を使う。` },
        { label: 'C', text: `backend-api は、ユーザーと直接やり取りせず、渡された Access Token を検証して JSON を返す側である。` },
        { label: 'D', text: `backend-web は、トークンを受け取って検証するだけで、ログイン画面は出さない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 2,
      explain: [
        `A：○ 違いはコードの置き場所だけで、そこから secret を隠せるかが変わる。`,
        `B：× どちらも同じ Authorization Code Flow を使う。`,
        `C：○ backend-api はトークンを受け取る側で、ログインはさせない。`,
        `D：× これは backend-api の説明。backend-web はログインをさせる側で、ログイン画面を出す。`
      ],
      tip: `「ログインさせる側(spa・web)」と「トークンを受け取る側(api)」を分け、spa と web の差は「secret を隠せるか」だけと整理する。` },
    { id: 'c07-mc-02', stem: `【正誤選択型】backend-api の Keycloak への登録に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'backend-api は、Authorization Code Flow でユーザーをログインさせるために登録する。',
        'backend-api は、トークンをブラウザのメモリに保持するため、XSS のリスクがある。',
        'backend-api は、必ず Client authentication OFF で、token 要求に client_secret を使う。',
        'backend-api は、Client authentication を ON にするしかなく、aud の宛先にはならない。',
        'backend-api は、aud の宛先・Client Role の置き場所・introspection の認証用として登録する。'
      ], answer: 5,
      explain: [
        `1：× backend-api はログインをさせない。ログインさせるのは frontend-spa と backend-web。`,
        `2：× ブラウザにトークンを保持するのは SPA。backend-api は受け取って検証するだけ。`,
        `3：× OFF とは限らず、用途次第。introspection を呼ぶときは ON + secret を使う。`,
        `4：× aud の宛先として名前が必要なのが、登録する理由の 1 つである。`,
        `5：○ 3 つの理由のとおり。ログインは行わないので、フローは全部 OFF でよい。`
      ],
      tip: `API は「ログインしない」けれど「宛先・ロールの置き場所・問い合わせの身元」として Keycloak に名前が要る。` },
    { id: 'c07-mc-03', stem: `【組合せ型】state に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `state は、戻ってきたレスポンスが自分の出したログインの結果かを、アプリが確かめるための値である。` },
        { label: 'B', text: `state は、ブラウザのセッションに保存した値と戻りの値を照合して初めて効果があり、付けるだけでは何も守れない。` },
        { label: 'C', text: `Keycloak は、戻りの URL に付ける前に、state を署名付きの値へ加工する。` },
        { label: 'D', text: `state が一致しなくても、code が有効であれば処理を続けてよい。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 1,
      explain: [
        `A：○ 「このレスポンスは自分が出したリクエストの答えか」を確認するための番号札である。`,
        `B：○ 照合しなければ、攻撃者が用意した URL を区別できない。`,
        `C：× Keycloak は state を何も加工せず、戻りの URL にそのまま付ける。署名もされない。`,
        `D：× 不一致や state なしの場合は、破棄してエラーにする。`
      ],
      tip: `state は「引換番号」。出す側(アプリ)が手元の控えと突き合わせるから意味がある。控えと照合しない番号札は飾りである。` },
    { id: 'c07-mc-04', stem: `【正誤選択型】state と PKCE の関係に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'state は URL に出るので、盗まれたら意味が無く、CSRF 対策としては役に立たない。',
        'state は、Taro のブラウザの通信やセッションの中身を読める攻撃者を想定して設計されている。',
        'state の照合は Keycloak が行い、PKCE の照合はアプリが行う。',
        'state は軽い照合札で守りの本命は PKCE であり、実務では両方を併用して多層防御にする。',
        'PKCE を使う場合、state を併用してはならないとされる。'
      ], answer: 4,
      explain: [
        `1：× 盗まれると破れるが、state が想定する攻撃者(リンクを踏ませるだけの Eve)にはそれができないので、CSRF 対策として働く。`,
        `2：× 想定する攻撃者は、通信やセッションの中身を見られない相手である。`,
        `3：× 逆で、state の照合はアプリ、PKCE の照合は Keycloak が行う。`,
        `4：○ 鍵が URL に出ない PKCE が本命だが、state も併用するのが実務の定番である。`,
        `5：× 併用が定番である。PKCE でも足りるとされるが、state を併用してはならないとはされていない。`
      ],
      tip: `state は URL に出る前提の軽い札、PKCE は鍵が URL に出ない本命。強さの違うものを重ねて多層防御にする。` },
    { id: 'c07-mc-05', stem: `【組合せ型】nonce に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `nonce は戻りの URL に付くので、アプリはコールバックを受けたときに照合する。` },
        { label: 'B', text: `nonce が無いと、過去に正規発行され署名が正しい ID Token を差し込まれても、署名・iss・aud・exp の検証を通ってしまう。` },
        { label: 'C', text: `nonce は ID Token に nonce claim として埋め込まれて署名されるので、攻撃者が書き換えると署名が壊れる。` },
        { label: 'D', text: `nonce は Authorization Code Flow では必須で、Implicit / Hybrid Flow では任意である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 3,
      explain: [
        `A：× 戻りの URL とコールバック時に関わるのは state。nonce は ID Token を検証するときに照合する。`,
        `B：○ これらの検証は本物のトークンかしか示さないので、リプレイが通ってしまう。`,
        `C：○ 署名された ID Token の中にあるので、差し替えは署名の破損として検出される。`,
        `D：× 逆で、必須なのは Implicit / Hybrid。Authorization Code Flow では任意だが推奨。`
      ],
      tip: `nonce は「署名の中に入った合言葉」。本物かどうかではなく「今回のログインのものか」を確かめる。` },
    { id: 'c07-mc-06', stem: `【正誤選択型】nonce によるリプレイ対策に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        '過去のトークンを差し込まれても、その nonce が今回保存した値と一致しないので拒否できる。',
        '署名・iss・aud・exp の検証が通れば、今回のログインの結果であることも保証される。',
        'nonce はログインごとに同じ値を使い回すことで、リプレイを防ぐ。',
        'nonce は URL に付くだけで署名されないので、state と同じ守り方をする。',
        'Authorization Code Flow では ID Token が直接返るため、nonce の検証は不要になる。'
      ], answer: 1,
      explain: [
        `1：○ 過去のログインで作られたトークンの nonce は過去の値なので、今回の値とは不一致になる。`,
        `2：× これらは本物のトークンかしか示さない。今回のログインの結果かは nonce で確かめる。`,
        `3：× nonce はログインごとに新しいランダム値を作る。同じ値の使い回しでは区別できない。`,
        `4：× nonce は署名された ID Token の中に入る。URL に付くだけで署名されないのは state の方。`,
        `5：× 盗まれにくくなるだけで、任意だが推奨であり、付けて検証するのが定石。`
      ],
      tip: `nonce の肝は「ログインごとに違う値」が「署名の中」にあること。古いトークンは古い値のまま、書き換えは署名で見破れる。` },
    { id: 'c07-mc-07', stem: `【組合せ型】PKCE に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `code_verifier のハッシュである code_challenge は、token 交換のときに初めて送る。` },
        { label: 'B', text: `PKCE が無い場合でも、Keycloak は送信者が正規のアプリかを確認できるので、盗まれた code は使えない。` },
        { label: 'C', text: `code_verifier は、認可リクエストにも code の戻りにも出ず、token 交換の直接 HTTPS 通信でだけ送られる。` },
        { label: 'D', text: `SHA-256 は一方向なので、code_challenge から code_verifier を逆算することはできない。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 5,
      explain: [
        `A：× code_challenge は認可リクエストで送る。token 交換で送るのは code_verifier の方。`,
        `B：× PKCE が無いと、Keycloak は送信者が正規のアプリか判断できず、code を持つ人なら誰でも交換できる。`,
        `C：○ 鍵は URL に出ない。直接通信だけで使うので盗まれにくい。`,
        `D：○ 錠(challenge)を見られても、鍵(verifier)は求められない。`
      ],
      tip: `鍵(verifier)は URL に出ない直接通信だけを通り、URL に出る錠(challenge)からは鍵を作れない。この非対称が PKCE の肝。` },
    { id: 'c07-mc-08', stem: `【正誤選択型】PKCE の性質に関する次の記述のうち、正しいものはどれか。`,
      items: [],
      choices: [
        'code_challenge_method=plain は challenge が verifier のハッシュなので、認可リクエストを見られても安全である。',
        'client secret はログインごとの使い捨てで、PKCE の code_verifier は長期間固定である。',
        'PKCE の値はログインごとの使い捨てで、盗まれても影響はその 1 回のログインだけである。',
        'Confidential client では、PKCE は併用できない。',
        'PKCE の照合は、アプリが保存した state と比較して行う。'
      ], answer: 3,
      explain: [
        `1：× plain は challenge が verifier そのままなので、認可リクエストを見られると鍵が丸見えになる。S256 を使う。`,
        `2：× 逆で、client secret が固定(長期間同じ)、PKCE がログインごとの使い捨て。`,
        `3：○ 使い捨てなので、盗まれても影響は 1 回のログインだけで済む。`,
        `4：× Confidential client でも PKCE の併用が推奨される。`,
        `5：× PKCE の照合は Keycloak が code_verifier のハッシュと code_challenge を比べて行う。state とは無関係。`
      ],
      tip: `secret は「長持ちで全ログインに影響」、PKCE は「毎回使い捨てで 1 回分だけ」。寿命の違いが被害範囲の違いになる。` },
    { id: 'c07-mc-09', stem: `【組合せ型】state・nonce・PKCE の整理に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`,
      items: [
        { label: 'A', text: `state は ID Token を守る値であり、アプリが ID Token の検証時に照合する。` },
        { label: 'B', text: `nonce は ID Token を守る値であり、アプリが ID Token の検証時に照合する。` },
        { label: 'C', text: `PKCE は戻りの URL を守る仕組みであり、アプリが照合する。` },
        { label: 'D', text: `PKCE は code の横取りから守る仕組みであり、照合するのは Keycloak である。` }
      ],
      choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], answer: 4,
      explain: [
        `A：× state が守るのは戻りの URL(CSRF 対策)で、コールバックを受けたときに照合する。`,
        `B：○ nonce は署名された ID Token の claim で、検証時にアプリが保存値と比べる。`,
        `C：× PKCE が守るのは code。照合するのも Keycloak である。`,
        `D：○ 盗んだ code を token に交換されないようにし、Keycloak が verifier と challenge を照合する。`
      ],
      tip: `守る対象は state=URL、nonce=ID Token、PKCE=code。照合する人は、PKCE だけ Keycloak、残り二つはアプリ。` }
  ]
});
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
