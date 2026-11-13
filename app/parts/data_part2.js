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
