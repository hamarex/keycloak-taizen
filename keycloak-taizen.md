---
title: Keycloak 大全集
markmap:
  colorFreezeLevel: 2
  initialExpandLevel: 3
  maxWidth: 480
---

# Keycloak 大全集

## 1. 全体像
### Keycloak とは
- OSS の IdP (Identity Provider) / 認証認可サーバー
- SSO・OAuth 2.0・OpenID Connect (OIDC)・SAML 2.0 をサポート
- 用語の関係
  - OAuth 2.0 = **認可**の枠組み (アクセストークンを渡す)
  - OIDC = OAuth 2.0 の上に **認証** (ID トークン) を足したもの
  - SAML = XML ベースの古い SSO 規格 (企業内システム連携で現役)
### 登場人物 (OAuth/OIDC の役割名)
- Resource Owner = ユーザー
- Client = アプリ (Keycloak 上の "Client")
- Authorization Server = Keycloak
- Resource Server = API (トークンを検証する側)
### 構造 (Keycloak の中に何があるか)
- **Realm (レルム)**
  - 何か: ユーザー・クライアント・設定をまとめる**独立した管理単位**(テナント)
  - ポイント: realm が違えば、ユーザーも設定も**完全に別物**。同じ username でも別人扱い
  - `master` realm = Keycloak 自体の管理者用。業務アプリのユーザーは入れない
  - 例: 自社アプリ用に `myrealm` を作る。URL は `/realms/myrealm/...`
- **Client (クライアント)**
  - 何か: Keycloak に**ログインを任せるアプリ/API の登録情報**
  - 1アプリ = 1 Client が基本。`client_id` で識別する
  - 例: `frontend-spa` (画面), `backend-api` (API), `batch-job` (バッチ)
  - 設定する内容: 許可するフロー、リダイレクト先 URL、認証方式 (secret の有無) など → 第5・6章
- **User (ユーザー)**
  - 何か: ログインする人。username / email / パスワード / 属性を持つ
- **Role (ロール)**
  - 何か: 権限のラベル。例 `admin`, `read`。ユーザーやグループに付ける → 第9章
- **Group (グループ)**
  - 何か: ユーザーの束。グループにロールを付けるとメンバー全員に効く
- **Client Scope (クライアントスコープ)**
  - 何か: トークンに載せる情報のセット → 第4章
  - **Protocol Mapper** = その中の「claim を1つ作る部品」
- **Identity Provider (IdP)**
  - 何か: **Keycloak の外にある**ログイン元 (Google, GitHub, 他の Keycloak, 企業の SAML)
  - 使うと「Google でログイン」ができる → 第7-9章
- **User Federation**
  - 何か: **既存のユーザー名簿** (LDAP / Active Directory) を Keycloak につなぐ → 第11章
- **Authentication Flow**
  - 何か: **ログイン手順の定義** (パスワード → OTP など) → 第10章
- **Session (セッション)**
  - 何か: 「ログイン中」という状態。Keycloak が覚えていて、2つ目のアプリでは再入力不要 (これが SSO)

## 2. 主要エンドポイント (OIDC)
### Discovery
- `GET http://localhost:8080/realms/myrealm/.well-known/openid-configuration`
- ここに下記すべての URL が載っている (**まずここを見る**)
### 一覧 (それぞれ何か)
- **authorization_endpoint** = 認可エンドポイント
  - `/realms/myrealm/protocol/openid-connect/auth`
  - 何者: **ユーザーのブラウザ**が開く「ログイン画面の入口」
  - 誰が呼ぶ: ブラウザ (アプリがリダイレクトさせる)。curl で叩くものではない
  - 何をする: ユーザー認証 + 同意 → `code` を redirect_uri に付けて返す
  - 主なパラメータ: `client_id`, `response_type=code`, `redirect_uri`, `scope`, `state`, `nonce`, `code_challenge`
  - 使う場面: Authorization Code Flow の最初の一歩
- **token_endpoint** = トークンエンドポイント
  - `/realms/myrealm/protocol/openid-connect/token`
  - 何者: **トークンを発行する窓口** (最重要)
  - 誰が呼ぶ: アプリのバックエンド / SPA が **直接 (バックチャネル) POST**
  - 何をする: `grant_type` に応じて access/id/refresh token を返す
    - `authorization_code` = code → token に交換
    - `client_credentials` = サーバー間
    - `refresh_token` = 再発行
    - `password` = ID/PW 直接 (非推奨)
    - `urn:ietf:params:oauth:grant-type:device_code` = デバイスフロー
    - `urn:ietf:params:oauth:grant-type:token-exchange` = トークン交換
  - Client authentication ON のクライアントはここで secret 等を提示する
- **userinfo_endpoint** = ユーザー情報エンドポイント
  - `/realms/myrealm/protocol/openid-connect/userinfo`
  - 何者: アクセストークンの持ち主の **プロフィール claim を返す API**
  - 誰が呼ぶ: クライアント (`Authorization: Bearer <access_token>` で GET/POST)
  - 返り値例: `{"sub":"8b1d...","preferred_username":"taro","email":"taro@example.com"}`
  - 使う場面: ID Token / Access Token を軽くして、詳細だけ後から取りたいとき
  - Mapper の「Add to userinfo」が ON の claim が返る
- **jwks_uri** = 公開鍵エンドポイント
  - `/realms/myrealm/protocol/openid-connect/certs`
  - 何者: トークンの**署名検証用の公開鍵一覧 (JWKS)**
  - 誰が呼ぶ: API / ライブラリ。認証不要で誰でも GET できる
  - 使い方: JWT header の `kid` と一致する鍵で署名を検証する。取得結果はキャッシュ
  - 鍵ローテーション時は複数の鍵が載る
- **introspection_endpoint** = トークン検査エンドポイント (RFC 7662)
  - `/realms/myrealm/protocol/openid-connect/token/introspect`
  - 何者: 「このトークンはまだ有効?」を **Keycloak に問い合わせる** 窓口
  - 誰が呼ぶ: API (Resource Server)。**呼び出し側のクライアント認証が必要** (secret 等)
  - 返り値: 有効なら `{"active":true,"sub":...,"scope":...}`、無効なら `{"active":false}`
  - JWKS によるローカル検証との違い: ログアウト/失効が**即反映**されるが、毎回通信が発生
- **end_session_endpoint** = ログアウトエンドポイント
  - `/realms/myrealm/protocol/openid-connect/logout`
  - 何者: Keycloak の **SSO セッションを終了**させる
  - 誰が呼ぶ: ブラウザ (GET でリダイレクト) / アプリのバックエンド (POST で refresh_token を渡す)
  - 主なパラメータ: `id_token_hint`, `post_logout_redirect_uri`, `state`
  - 注意: アプリ側のセッションを消すだけでは Keycloak にはログイン状態が残る
- **device_authorization_endpoint** = デバイス認可エンドポイント
  - `/realms/myrealm/protocol/openid-connect/auth/device`
  - 何者: TV / CLI などブラウザ入力しにくい機器向けの**開始窓口**
  - 誰が呼ぶ: デバイス側アプリが POST
  - 返り値: `device_code`, `user_code`, `verification_uri`, `interval`
  - 以降: ユーザーが別端末で承認 → デバイスが token_endpoint をポーリング
- **revocation_endpoint** = トークン失効エンドポイント (RFC 7009)
  - `/realms/myrealm/protocol/openid-connect/revoke`
  - 何者: 指定した Refresh / Access Token を**無効化**する
  - 誰が呼ぶ: クライアントが POST (`token=...`, client 認証)
  - 使う場面: ユーザーのログアウト時や、トークン漏洩が疑われるとき
- **issuer** (エンドポイントではなく識別子)
  - `http://localhost:8080/realms/myrealm`
  - トークンの `iss` と一致する値。Spring の `issuer-uri` にはこれを指定
- その他 discovery に載るもの
  - `registration_endpoint` = Dynamic Client Registration (クライアントの自動登録)
  - `check_session_iframe` = ブラウザ側のセッション状態監視用
  - `backchannel_authentication_endpoint` = CIBA (ユーザー操作を別端末で承認)
  - `pushed_authorization_request_endpoint` = PAR (認可リクエストを事前にサーバー送信)
  - `mtls_endpoint_aliases` = mTLS 用の別 URL
### 呼び出し元の整理
- ブラウザが開く: authorization, end_session
- アプリ/サーバーが直接叩く (認証あり): token, introspection, revocation, device_authorization
- Bearer 付きで叩く: userinfo
- 誰でも取得できる: discovery, jwks_uri
### 流れの中での位置づけ
- ログイン: discovery → **auth** → (ログイン) → **token** → API 呼び出し (API は **certs** で検証)
- 補助: **userinfo** (詳細取得), **introspect** (即時失効確認), **revoke** (失効)
- 終了: **logout**
### 注意
- Keycloak 17 以降 (Quarkus 版) は `/auth` プレフィックスなし
- 旧 WildFly 版は `/auth/realms/...`

## 3. トークンと Claim
### そもそも Claim とは
- **claim (クレーム) = トークンの中に入っている「1つの情報」(名前と値のペア)**
  - 英語の意味は「主張」。「この人は taro です」「メールは taro@example.com です」とトークンが**主張している**イメージ
- JWT の payload (JSON) の `"キー": 値` 1行が 1 claim
  ```json
  { "preferred_username": "taro", "email": "taro@example.com" }
  ```
  - ↑ claim が 2 つ。名前 = `preferred_username` / 値 = `"taro"`
- 種類
  - **標準 claim**: 仕様で名前が決まっている (`iss`, `sub`, `aud`, `exp`, `email`, `name` ...)
  - **Keycloak 独自**: `realm_access`, `resource_access` など
  - **カスタム claim**: 自分で作る (`dept`, `tenant` など。Mapper で作る → 第4章)
- 「トークンに何を載せるか」= 「どの claim を入れるか」。それを決めるのが Mapper
### トークンの種類
- Access Token
  - API を呼ぶための通行証。**宛先は API (Resource Server)**
  - Keycloak は JWT 形式 (`typ: Bearer`)
- ID Token
  - 「誰がログインしたか」をクライアントに伝える。**宛先は Client 自身**
  - `typ: ID`
- Refresh Token
  - アクセストークンの再発行用。`typ: Refresh`
  - 宛先は Keycloak 自身 (`aud` = realm の issuer URL)
- Offline Token
  - 長期 Refresh Token (`scope=offline_access`)
### JWT の構造
- `header.payload.signature` (Base64URL を `.` でつなぐ)
- header 例
  ```json
  { "alg": "RS256", "typ": "JWT", "kid": "abc123..." }
  ```
  - `kid` = どの鍵で署名したか → JWKS から同じ kid の公開鍵を探す
### Access Token の payload 例 (全体)
```json
{
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
}
```
### 標準 Claim の意味
- **iss** (Issuer)
  - 「誰が発行したか」= Keycloak の realm の URL
  - 例: `"iss": "http://localhost:8080/realms/myrealm"`
  - 検証: 自分が信頼する issuer と**完全一致**するか
  - 落とし穴
    - `localhost:8080` と `keycloak:8080` (Docker 内) で値が変わる
    - → フロントURL (Frontend URL / `KC_HOSTNAME`) を固定して揃える
    - reverse proxy 越しだと `https://auth.example.com/realms/myrealm`
- **sub** (Subject)
  - ユーザーを一意に示す ID。Keycloak では UUID
  - 例: `"sub": "8b1d6c3e-aaaa-bbbb-cccc-1234567890ab"`
  - email や username は変わりうるので、**DB の紐付けキーには sub を使う**
  - client_credentials の場合は「service account ユーザー」の UUID
- **aud** (Audience)
  - 「このトークンは誰宛か」
  - 例: `"aud": ["backend-api", "account"]` (文字列 1 個のこともある)
  - API 側の検証: **自分の名前が aud に入っていなければ拒否**
  - なぜ必要?
    - トークンを別 API に使い回されるのを防ぐ (Confused Deputy 対策)
  - Keycloak の挙動
    - デフォルトでは **`account` しか入らない**ことが多い
    - 自分の API 名を入れるには **Audience Mapper** か **Audience Resolve** (後述)
  - ID Token の aud = 発行先 client_id (例: `"aud": "frontend-spa"`)
- **azp** (Authorized Party)
  - 「トークンを**要求した**クライアント」= 呼び出し元アプリ
  - 例: `"azp": "frontend-spa"`
  - aud (宛先) と azp (要求者) は別物
    - SPA `frontend-spa` が API `backend-api` 向けトークンを取得
      → `azp=frontend-spa`, `aud=backend-api`
- **exp** (Expiration) 有効期限 (UNIX 秒)
  - デフォルト Access Token は 5 分 (Realm settings → Tokens)
- **iat** (Issued At) 発行時刻
- **nbf** (Not Before) この時刻より前は無効
- **jti** (JWT ID) トークン固有 ID (リプレイ検知・失効管理)
- **typ** トークン種別 (`Bearer` / `ID` / `Refresh`)
- **scope** 付与されたスコープ (スペース区切り)
  - 例: `"scope": "openid profile email"`
- **sid** セッション ID (Keycloak の SSO セッション)
- **auth_time** ユーザーが実際に認証した時刻
- **nonce** ID Token のリプレイ防止 (認可リクエストで送った値がそのまま返る)
- **acr** 認証強度 (Level of Authentication。MFA 済みなど)
- **at_hash / c_hash** 他トークンとの紐付けハッシュ (ID Token)
### Keycloak 独自 Claim
- `realm_access.roles` = Realm Role
- `resource_access.<client>.roles` = Client Role
- `preferred_username` ログイン名
- `allowed-origins` Web Origins 設定値
- `groups` (Group Membership Mapper を作ったとき)
### 読み方のコツ
- https://jwt.io に貼って decode (※本番トークンは貼らない)
- CLI: `echo "<payload部分>" | base64 -d | jq` (padding に注意)

## 4. Client Scope と Mapper
### まず全体の関係 (ここが分かれば後は楽)
- 目的: 「**どのユーザー情報を、どの名前で、どのトークンに入れるか**」を決める仕組み
- 部品は3つ
  - **Mapper** = 1個の claim を作る**最小部品** (例: 「ユーザーの email を `email` claim にする」)
  - **Client Scope** = Mapper を何個かまとめた**セット** (例: `email` スコープ = email と email_verified の Mapper 2個)
  - **Client** = どの Client Scope を使うかを選ぶ**利用者**
- 図
  ```
  Client (frontend-spa)
    └─ 使う Client Scope を選ぶ
         ├─ profile  ── Mapper: username → preferred_username
         │              Mapper: firstName → given_name ...
         ├─ email    ── Mapper: email → email
         │              Mapper: emailVerified → email_verified
         └─ roles    ── Mapper: ロール → realm_access / resource_access
                                   ↓
                      トークンの claim (JSON) になる
  ```
- なぜ分けている?
  - 同じ「email を載せる」設定を、クライアントごとに作り直さず**使い回す**ため
### Client Scope とは
- 定義: **「トークンに載せる情報のひとまとまり」に名前を付けたもの**
- 持っているもの (タブ)
  - **Mappers**: どの claim を作るか
  - **Scope**: そのスコープを使うとき、トークンに載せてよい**ロール**の範囲 (Role scope mapping)
  - **Settings**: 名前、説明、「Include in token scope」(トークンの `scope` claim に名前を載せるか) など
- 「scope」という言葉は 2 つの意味がある (混乱しやすい)
  - OAuth の `scope` パラメータ = クライアントがリクエストで指定する文字列 (`scope=openid profile email`)
  - Keycloak の Client Scope = それに対応する設定の実体 (名前が `profile` の Client Scope)
  - つまり**リクエストの `scope=profile` が、Keycloak 上の `profile` という名前の Client Scope を呼び出す**
### Default と Optional (Client にどう紐付けるか)
- **Default Scope**
  - リクエストで `scope` に書かなくても**常に適用**される
  - 例: `profile`, `email`, `roles` は通常 Default
- **Optional Scope**
  - リクエストの `scope=` に**名前を書いたときだけ**適用される
  - 例: `phone` を Optional にしておき、`scope=openid phone` と要求した時だけ phone_number が載る
- 使い分け
  - 常に必要 → Default / 機微な情報で必要な時だけ → Optional (最小限の情報だけ渡す)
- 設定場所: Clients → 対象 → Client scopes タブ
### 標準 Client Scope (Keycloak が最初から用意しているもの)
- 「標準」= realm を作ると**最初から入っている**スコープ。OIDC の仕様で決まっている名前に対応
- 一覧と役割
  - **`openid`** (必須級)
    - 「OIDC として動かす」宣言。これが無いと ID Token が返らない
    - ※ Keycloak では `scope` 文字列に書く特別な値で、実体の Client Scope としては見えないことが多い
  - **`profile`**
    - 名前系の情報。`name`, `given_name`, `family_name`, `preferred_username`, `nickname`, `locale` など
  - **`email`**
    - `email` (アドレス) と `email_verified` (確認済みか true/false)
  - **`roles`**
    - ユーザーのロールを載せる。`realm_access.roles` と `resource_access.<client>.roles`
    - **Audience Resolve** (ロールを持つ client を `aud` に自動追加) もここに入っている
  - **`web-origins`**
    - Client の Web Origins 設定を `allowed-origins` claim に載せる (CORS 用)
  - **`acr`**
    - 認証の強度 (MFA したか等) を `acr` claim に載せる
  - **`basic`** (v25+)
    - 全トークンに必要な基本 claim (`sub`, `auth_time`) を載せる
  - **`offline_access`**
    - 「長期間使える Refresh Token (Offline Token) が欲しい」というリクエスト用
  - **`address`** : 住所 (`address` claim)
  - **`phone`** : 電話番号 (`phone_number`, `phone_number_verified`)
  - **`microprofile-jwt`** : MicroProfile JWT 仕様向けの claim (`groups`, `upn`)
  - **`service_account`** : Client Credentials のとき Service Account 用の claim を足す
  - **`organization`** (v26) : 所属 Organization を載せる
- 自分でも作れる
  - 例: `company-info` という Client Scope を作り、Mapper で `department` を入れる
### Dedicated Scope (専用スコープ)
- `<client名>-dedicated` として各 Client に**自動で1つ**ある、そのクライアント専用の Client Scope
- 他の Client と共有しない Mapper (例: このクライアント専用の Audience) はここに置く
- 場所: Clients → 対象 → Client scopes → `xxx-dedicated`
### Mapper とは
- 定義: **ユーザー情報やロール等の元データを読み取り、トークンの claim に変換する部品**
- 1つの Mapper = 1つ(または1系統)の claim を作る
- 例
  - 元データ: ユーザー属性 `department = sales`
  - Mapper: User Attribute Mapper (Token Claim Name = `dept`)
  - 結果: トークンに `"dept": "sales"`
- 正式名称は **Protocol Mapper** (OIDC / SAML ごとに種類が違う。ここは OIDC)
- 追加方法: Client scopes → 対象 → Mappers → Configure a new mapper (または By configuration)
### Mapper の種類 (Mapper Type) と何をするか
- **User Attribute**
  - 何をする: ユーザーに付けた**独自属性**を claim にする
  - 使う場面: 部署、社員番号、テナントIDなど Keycloak 標準にない項目
  - 設定例: User Attribute=`department` / Token Claim Name=`dept` / Claim JSON Type=`String`
  - 結果: `"dept": "sales"`
- **User Property**
  - 何をする: ユーザーの**標準項目** (username, email, firstName, lastName など) を claim にする
  - 設定例: Property=`username` / Token Claim Name=`preferred_username`
  - User Attribute との違い: Property は Keycloak 組み込みの項目、Attribute は管理者が自由に追加した項目
- **User Realm Role**
  - 何をする: ユーザーの **Realm Role** を claim にする (既定は `realm_access.roles`)
  - 設定例: Token Claim Name=`realm_access.roles` / Multivalued=ON
  - 結果: `"realm_access": {"roles": ["user","admin"]}`
- **User Client Role**
  - 何をする: 特定 Client の **Client Role** を claim にする (既定は `resource_access.<client>.roles`)
  - 設定例: Client ID=`backend-api` / Token Claim Name=`roles`
  - 結果: `"roles": ["read","write"]` のように**フラットな名前**にもできる (API が読みやすい)
- **Audience**
  - 何をする: 指定した client_id を `aud` に**固定で追加**
  - 設定例: Included Client Audience=`backend-api` / Add to access token=ON
  - 結果: `"aud": ["backend-api"]`
  - 使う場面: 「API は aud に自分の名前が無いと拒否する」とき
- **Audience Resolve**
  - 何をする: ユーザーが**ロールを持っている Client を自動で** `aud` に追加
  - 設定不要 (`roles` スコープに最初から入っている)
  - Audience との違い: 固定か (Audience)、ロールに応じて自動か (Resolve)
- **Group Membership**
  - 何をする: ユーザーの所属**グループ名**を claim にする
  - 設定例: Token Claim Name=`groups` / Full group path=OFF
  - 結果: OFF → `["dev","admin"]` / ON → `["/company/dev","/admin"]`
- **Hardcoded claim**
  - 何をする: **誰でも同じ固定値**を claim に入れる
  - 設定例: Token Claim Name=`tenant` / Claim value=`acme`
  - 結果: `"tenant": "acme"`
  - 使う場面: クライアントごとに固定のラベルを付けたい時
- **Hardcoded role**
  - 何をする: ロールを**強制的にトークンに追加** (ユーザーへの付与なしで)
- **Role Name Mapper**
  - 何をする: ロールの**名前を別名に置換** (例: `admin` → `administrator`)
- **Full name**
  - 何をする: firstName + lastName を合成して `name` claim にする
- **Script Mapper**
  - 何をする: JavaScript で自由に claim を作る (セキュリティ上、既定で無効・非推奨)
- **SHA-256 Pairwise sub**
  - 何をする: `sub` をクライアントごとに別の値にする (クライアント間でユーザーを突合できなくする、プライバシー用)
### Mapper の設定項目 (画面の各項目の意味)
- **Name**
  - 管理画面での表示名。**トークンには影響しない**。分かりやすい名前でOK
- **Mapper Type**
  - 上の種類 (User Attribute など)。作成時に決める
- **User Attribute / Property** (Mapper 種別による)
  - **元データ**側の指定。「ユーザーのどの項目を読むか」
- **Token Claim Name**
  - **トークン内に出力する claim の名前**。最重要項目
  - 例: `dept` → `"dept": "sales"`
  - `.` でネスト: `org.dept` → `{"org": {"dept": "sales"}}`
  - 名前に `.` を含めたい: `a\.b` とエスケープ
- **Claim JSON Type**
  - claim の**値の型**
  - `String` = 文字列 `"1"` / `int`,`long` = 数値 `1` / `boolean` = `true` / `JSON` = オブジェクトや配列
  - 型を間違えると API 側のパースで失敗する (数値なのに String など)
- **Multivalued**
  - ON = 値が複数の**配列** (`["a","b"]`)、OFF = 単一値 (`"a"`)
  - ロールやグループは ON
- **Aggregate attribute values**
  - 複数の値(グループやロールに同名属性がある場合)を**まとめて配列にする**
- **Add to ID token**
  - ON でこの claim を **ID Token** に入れる (アプリがユーザーを知るため)
- **Add to access token**
  - ON でこの claim を **Access Token** に入れる (API が認可判断に使う)
- **Add to lightweight access token**
  - ON で **軽量版 Access Token** にも入れる (v24+。通常は OFF にしてトークンを小さく保つ)
- **Add to userinfo**
  - ON で `/userinfo` の返り値に入れる
- **Add to token introspection**
  - ON で `/token/introspect` の返り値に入れる
- **Add to access token response** (一部の Mapper)
  - ON でトークンレスポンス JSON 本体にも出す
- ポイント
  - 「どのトークンに載るか」は上の **Add to ...** のチェックで決まる
  - claim が出ないとき最初に疑うのは、Add to access token が OFF のこと
### 具体例: 「API が aud=backend-api を要求する」
- 症状: API が 401。トークンの `aud` が `["account"]` で `backend-api` が無い
- 手順 A (Audience Mapper で固定)
  - Clients → `frontend-spa` → Client scopes → `frontend-spa-dedicated` → Configure a new mapper → Audience
  - Included Client Audience=`backend-api`, Add to access token=ON
- 手順 B (ロールで自動)
  - `backend-api` に Client Role `read` を作ってユーザーに付与
  - `roles` スコープの Audience Resolve が働き `aud` に追加される
  - Full Scope Allowed が OFF の場合は、Client の Scope タブでそのロールを許可する
### Full Scope Allowed
- 意味: **ユーザーが持つ全ロールをトークンに載せるか**
- ON (既定): 全部載る (簡単だがトークンが大きく、権限が広い)
- OFF: Client Scope / Client の Scope タブで**許可したロールだけ**載る (最小権限)
### Lightweight Access Token
- Access Token を小さくし、詳細な claim は userinfo / introspection で取る方式 (v24+)
- Client の Advanced タブで有効化。Mapper の「Add to lightweight access token」で載せる claim を選ぶ

## 5. Client 設定
### この章の見方
- Clients → 対象クライアント を開いたときの各タブ・各項目の意味
- 「Client = アプリの入館証の設定」と考えると分かりやすい
  - どの入口(フロー)から入れるか / 戻ってよい場所(URL) / 本人確認の方法(認証)
### 基本項目 (Settings タブ上部)
- **Client ID**
  - アプリを識別する名前。**自分で決める文字列** (例 `frontend-spa`)
  - 認可リクエストの `client_id=` に使う。トークンの `azp` / `aud` にも出る
- **Client UUID** (画面には出にくい)
  - Keycloak 内部の ID。Admin REST API の URL (`/clients/{uuid}`) で使う。Client ID とは別物
- **Name / Description**: 管理画面の表示用。動作には影響しない
- **Always display in UI**: ログイン後のアカウント画面にこのアプリを必ず表示するか
### Capability config (このクライアントの「能力」)
- **Client authentication**
  - ON = Confidential (secret 等で本人証明する) / OFF = Public → 詳細は第6章
- **Authorization**
  - ON にすると **Authorization Services** (リソース・ポリシー・パーミッションによる細かい認可) が使える
  - 普通のロール認可だけなら OFF のままでよい
- **Authentication flow** (許可する「トークンの取り方」のチェックボックス)
  - **Standard flow**
    - = Authorization Code Flow。ブラウザでログイン→ code→ token。**通常はこれ**
  - **Direct access grants**
    - = Password Grant。アプリが ID/パスワードを直接受け取る。非推奨 (テスト用)
  - **Implicit flow**
    - = ブラウザにトークンを直接返す古い方式。非推奨
  - **Service accounts roles**
    - = Client Credentials Grant。ユーザー不在でクライアント自身がトークンを取る。Client authentication ON が必要
  - **OAuth 2.0 Device Authorization Grant**
    - = TV/CLI 向けのデバイスフロー
  - **OIDC CIBA Grant**
    - = ユーザーが別端末(スマホ)で承認するバックチャネル認証。銀行等
  - **Standard Token Exchange** (v26.2+)
    - = 手持ちのトークンを別 audience 用のトークンに交換
  - 原則: **使うものだけ ON、他は OFF** (攻撃面を減らす)
- **PKCE Method** (Advanced タブ内)
  - `S256` を指定すると、PKCE (code_challenge) が無いリクエストを**拒否**する
### Access settings (URL に関する設定)
- **Root URL**: アプリの基準 URL。他の相対 URL の頭に付く (例 `https://app.example.com`)
- **Home URL**: アカウント画面などから「アプリへ戻る」ときのリンク先
- **Valid redirect URIs**
  - 何か: ログイン成功後に `code` を持たせて**戻してよい URL のホワイトリスト**
  - なぜ必要: 攻撃者の URL に code を送らせない (これが最重要のセキュリティ設定)
  - 書き方: **完全一致**、または末尾 `*` でワイルドカード
  - 例: `http://localhost:3000/callback` / `https://app.example.com/*`
  - 不一致のエラー: `Invalid parameter: redirect_uri`
  - 本番で `*` だけは危険
- **Valid post logout redirect URIs**
  - ログアウト後に戻してよい URL。logout の `post_logout_redirect_uri` に使う
- **Web origins**
  - 何か: ブラウザの **CORS で許可する送信元**。SPA が token endpoint を fetch する時に必要
  - 例: `https://app.example.com`
  - `+` = Valid redirect URIs の origin を自動で許可 / `*` = 全許可 (非推奨)
  - トークンの `allowed-origins` claim になる
- **Admin URL**: Keycloak からアプリへ通知を送る先 (バックチャネルログアウト等)
### Login settings
- **Login theme**: ログイン画面のデザインを Client ごとに変える
- **Consent required**: ログイン時に「このアプリに情報を渡してよいか」の**同意画面**を出す
- **Display client on screen**: 同意画面にクライアント名を表示
### Logout settings
- **Front channel logout**: ブラウザ経由 (iframe) でアプリのログアウトを通知
- **Backchannel logout URL**: Keycloak がアプリのサーバーへ直接 `logout_token` を POST する先
- **Backchannel logout session required**: logout_token に `sid` を含める
### Credentials タブ (Client authentication ON のときだけ出る)
- **Client Authenticator** = トークン取得時に「自分が本物のクライアントだ」と示す方法
  - **Client Id and Secret** (`client_secret_basic` / `client_secret_post`)
    - 共通の合言葉 (secret) を送る。**一番簡単で一般的**
    - basic = `Authorization: Basic` ヘッダ / post = リクエスト body
  - **Signed Jwt** (`private_key_jwt`)
    - クライアントが**秘密鍵で署名した JWT** を送る。Keycloak は登録済みの公開鍵で検証
    - secret が通信に乗らないので安全。金融系などで使う
  - **Signed Jwt with Client Secret** (`client_secret_jwt`)
    - secret を鍵にして署名した JWT を送る
  - **X509 Certificate** (mTLS)
    - クライアント証明書で本人確認
- **Client secret**: 合言葉の実体。**Regenerate** で再生成 (古い secret は即無効)
- **Client secret rotation**: 旧 secret を一定期間だけ併用して無停止で入れ替える機能
### Client scopes タブ
- このクライアントに紐付ける Client Scope と Default/Optional → 第4章
- **Evaluate** サブタブ: ユーザーを選んで**実際のトークン内容をプレビュー**できる (デバッグに便利)
### Roles タブ
- このクライアント専用の **Client Role** を作る場所 (例 `read`, `write`)
### Service accounts roles タブ (Service accounts roles ON のとき)
- Client Credentials で取ったトークンに付く**ロールの設定場所**
### Advanced タブ (主な項目)
- **Access Token Lifespan**: このクライアントだけトークン寿命を変える (Realm 設定を上書き)
- **Proof Key for Code Exchange Code Challenge Method**: PKCE の強制 (S256)
- **Lightweight access token**: 軽量アクセストークンを使う
- **Authentication flow overrides**: このクライアントだけログイン手順を別フローにする
### Token 寿命 (Realm 全体の設定)
- 場所: Realm settings → Tokens / Sessions
- **Access Token Lifespan** (既定 5 分)
  - アクセストークンが有効な時間。短いほど漏洩に強い
- **SSO Session Idle** (既定 30 分)
  - 何も操作がなければログイン状態が切れるまでの時間
- **SSO Session Max** (既定 10 時間)
  - 操作していても強制的にログアウトされる上限
- **Client Session Idle / Max**
  - クライアント単位のセッション期限 (Refresh Token の寿命に影響)
- **Offline Session Idle** (既定 30 日): オフライントークンの期限

## 6. Client authentication ON / OFF
### 要点
- ON = **Confidential client** (秘密を安全に保持できる)
  - サーバーサイド Web アプリ、バックエンド、バッチ
- OFF = **Public client** (秘密を持てない)
  - SPA (React/Vue)、モバイル、デスクトップ、CLI
  - 配布物に secret を入れても**抜き取られる**ので意味がない
- 本質: **「トークンエンドポイントで、このクライアント自身が本人だと証明できるか」**
### 比較表
- | 項目 | ON (Confidential) | OFF (Public) |
  |---|---|---|
  | OAuth 用語 | confidential | public |
  | Credentials タブ | あり (secret 等) | なし |
  | token 要求時の認証 | client_id + secret (等) 必須 | `client_id` のみ |
  | Authorization Code Flow | ○ | ○ (**PKCE 必須級**) |
  | PKCE | 推奨 (併用可) | **事実上必須** |
  | Client Credentials Grant | ○ (Service accounts roles) | ✕ 使えない |
  | Direct Access Grants | ○ | ○ (非推奨) |
  | Device Flow | ○ | ○ (よく使う) |
  | Authorization Services | ○ | ✕ |
  | 典型例 | Spring/Rails/Node サーバー, API | SPA, iOS/Android, CLI |
  | 漏洩リスク | secret を守れば低い | コード横取り攻撃を PKCE で防御 |
### token リクエストの違い (具体例)
- ON: Basic 認証ヘッダ
  ```bash
  curl -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
    -u 'backend-web:s3cr3t-AbCdEf' \
    -d grant_type=authorization_code \
    -d code=AUTH_CODE \
    -d redirect_uri=https://app.example.com/callback
  ```
- ON: body に載せる方式 (client_secret_post)
  ```bash
  curl -X POST .../token \
    -d client_id=backend-web -d client_secret=s3cr3t-AbCdEf \
    -d grant_type=authorization_code -d code=AUTH_CODE \
    -d redirect_uri=https://app.example.com/callback
  ```
- OFF: secret なし、代わりに code_verifier
  ```bash
  curl -X POST .../token \
    -d client_id=frontend-spa \
    -d grant_type=authorization_code -d code=AUTH_CODE \
    -d redirect_uri=http://localhost:3000/callback \
    -d code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
  ```
- OFF で secret 無しなのに「誰でも token を取れる?」
  - → code は**ユーザー認証後にしか出ない**
  - → code は code_verifier を知る者だけが交換できる (PKCE)
  - → redirect_uri は登録 URL に限定
### ON/OFF の切り替えで起きること
- ON → OFF: Credentials タブ消滅、Service accounts roles も使えなくなる
- OFF → ON: secret が生成される。既存アプリは secret を設定しないと `unauthorized_client` / `invalid_client`
### よくあるエラー
- ON なのに secret 無し → `{"error":"unauthorized_client","error_description":"Invalid client or Invalid client credentials"}`
- OFF なのに client_credentials → `unauthorized_client` ("Public client not allowed to retrieve service account")
- PKCE 強制なのに challenge 無し → `Missing parameter: code_challenge_method`
### 選び方フローチャート
- ユーザーログイン不要でサーバー間通信? → **ON** + Client Credentials
- サーバー側にコードがあり secret を隠せる Web アプリ? → **ON** + Auth Code
- ブラウザ/モバイルにコードが配布される? → **OFF** + Auth Code + PKCE
- Backend For Frontend (BFF) 構成? → BFF を **ON**、SPA は直接 Keycloak と話さない
- API (Resource Server) がトークンを検証するだけ? → Client 不要 or **bearer-only 相当** (v26 では ON でフロー全部 OFF)

## 7. フロー詳細 (具体的な通信)
### 前提値
- Keycloak: `http://localhost:8080`, realm: `myrealm`
- SPA client: `frontend-spa` (Client auth OFF)
- Web client: `backend-web` (Client auth ON, secret=`s3cr3t`)
- API: `backend-api`
### この3つの違い (登場アプリのたとえ話)
- 例: 社内の「経費精算システム」を3つの部品で作っている
  - `frontend-spa` = ブラウザで動く画面だけのアプリ (React など)
  - `backend-web` = サーバーが画面も作って返す Web アプリ (Spring MVC, Rails, Express など)
  - `backend-api` = 画面を持たず、データだけを JSON で返す API サーバー
- 比較表
  - | 項目 | `frontend-spa` | `backend-web` | `backend-api` |
    |---|---|---|---|
    | 種類 | SPA (JS がブラウザで実行) | サーバーサイド Web アプリ | REST API (Resource Server) |
    | コードの置き場所 | **ユーザーのブラウザ** | **自社サーバー** | 自社サーバー |
    | secret を隠せる? | ✕ (JS は丸見え) | ○ (サーバー内) | ○ |
    | Client authentication | **OFF (Public)** | **ON (Confidential)** | 用途次第 (後述) |
    | ログイン画面を出す? | 出す (Keycloak へ転送) | 出す (Keycloak へ転送) | **出さない** |
    | 使うフロー | Auth Code + **PKCE** | Auth Code (+ PKCE 推奨) | フローは使わない |
    | トークンの扱い | ブラウザに保持 (漏洩に注意) | **サーバーに保持**(ブラウザに出さない) | **受け取って検証するだけ** |
    | トークンの中での役割 | `azp` (要求者) / ID Token の `aud` | `azp` (要求者) / ID Token の `aud` | Access Token の `aud` (宛先) |
- `frontend-spa` と `backend-web` の違い (**ここが一番の疑問点**)
  - どちらも「ユーザーをログインさせるアプリ」で、フローは同じ Authorization Code Flow
  - 違いは **「コードがどこで動くか」だけ**
    - SPA: コードごとユーザーに配布される → secret を書いても抜かれる → secret なし + PKCE で守る
    - Web: コードは自社サーバー内 → secret を安全に持てる → secret で本人証明
  - 結果、token endpoint へのリクエストが変わる
    - SPA: `client_id` + `code_verifier` (secret なし)
    - Web: `client_id` + **`client_secret`** (+ 任意で `code_verifier`)
  - トークンの置き場所も違う
    - SPA: ブラウザのメモリ等 (XSS で盗まれるリスク)
    - Web: サーバーのセッションに保存し、ブラウザには Cookie だけ渡す (安全)
- `backend-web` と `backend-api` の違い
  - `backend-web` = **ログインをさせる側** (ユーザーと直接やり取りする)
  - `backend-api` = **トークンを受け取る側** (ユーザーとは話さず、渡された Access Token を検証して JSON を返すだけ)
  - 名前に backend が付くが役割は別。Keycloak 上の登録も別
- `backend-api` を Keycloak に登録する理由
  - ① **`aud` の宛先**として名前が必要 (Audience Mapper で `backend-api` を指定する)
  - ② **Client Role** (`read`, `write`) の置き場所にする
  - ③ **introspection** を呼ぶときの認証用 (この場合は Client auth ON + secret)
  - ログインは行わないので、フロー (Standard flow 等) は全部 OFF でよい
- 全体の流れ (SPA + API の場合)
  ```
  ユーザー ─ログイン→ frontend-spa ──Keycloakでログイン──> Keycloak
                          │  (azp=frontend-spa, aud=backend-api の token を受け取る)
                          └─ Bearer token ─> backend-api ─(署名・iss・aud検証)→ JSON返却
  ```
- 全体の流れ (サーバーサイド Web + API の場合)
  ```
  ブラウザ ─> backend-web (secret で Keycloak から token 取得、サーバーに保存)
                  └─ Bearer token ─> backend-api
  ```
- この資料の例の読み方
  - 7-1 の token 交換で 「Public (OFF)」= `frontend-spa`、「Confidential (ON)」= `backend-web`
  - Resource Server として `aud` を見て検証するのが `backend-api`

### フローに出てくる用語を先に理解する (7-1 を読む前に)
- 全体像: 7-1 の登場キーワードを「何のために・誰が作り・誰が確認するか」で整理する
  - | 用語 | 一言でいうと | 作る人 | 確認する人 | 守る相手 |
    |---|---|---|---|---|
    | state | リクエストと応答の**引換番号** | アプリ | アプリ | CSRF (他人のログインを押し付けられる) |
    | nonce | ID Token の**使い回し防止の合言葉** | アプリ | アプリ | ID Token のリプレイ |
    | PKCE | code の**横取り対策**の鍵と錠 | アプリ | Keycloak | code を盗まれる |
    | JWT | 情報を入れた**署名付きの書類** | Keycloak | API・アプリ | 改ざん |
    | JWS / kid / JWKS | 書類に押す**印鑑と印鑑証明** | Keycloak | API・アプリ | 偽造 |
    | Bearer token | **持っている人が使える入場券** | Keycloak | API | (盗まれると悪用される) |
    | Introspection | 券が今も有効かの**問い合わせ窓口** | Keycloak | API | 失効後の悪用 |
- 7-1 のどこで出てくるか
  - 手順2: PKCE の `code_verifier` / `code_challenge` を作る
  - 手順3: 認可リクエストに `state` / `nonce` / `code_challenge` を付ける
  - 手順5: 戻りの URL の `state` を照合する
  - 手順6〜7: token 交換で `code_verifier` を送り、Keycloak が PKCE を検証する
  - 手順8: JWT (access / id token) が返る (`token_type: Bearer`)
  - 手順9: ID Token の署名 (JWS / kid / JWKS) と `nonce` を検証する
  - 手順10〜11: Bearer token で API を呼び、API が JWT を検証する (または introspection)
### state (CSRF 対策)
- 先に結論: **「今ブラウザに戻ってきたこのレスポンスは、自分が出したログインの結果か?」をアプリが確かめるための番号札**
- CSRF とは
  - Cross-Site Request Forgery。**罪のない人のブラウザに、攻撃者が用意したリクエストを実行させる**攻撃
  - ここでは「攻撃者が作ったログイン完了 URL を、被害者に踏ませる」形で起きる (Login CSRF)
- 具体的な攻撃シナリオ (state が**無い**場合)
  - 登場人物: 攻撃者 Eve / 被害者 Taro / 経費アプリ (`https://app.example.com`)
  1. Eve が**自分のアカウント**で経費アプリにログインを始め、Keycloak でログインする
  2. Keycloak が Eve のブラウザを戻す
     ```
     https://app.example.com/callback?code=EVE-CODE-123
     ```
     - Eve は**この URL を開かずに止めて**、URL だけ手元に控える (code は未使用のまま)
  3. Eve が Taro にこの URL をメール・SNS・画像タグなどで踏ませる
  4. Taro のブラウザが `https://app.example.com/callback?code=EVE-CODE-123` を開く
  5. アプリは「code が来た」としか分からず、そのまま token に交換する
     - **自分が出したログインの結果かどうかを確認する手段が無い**
  6. 結果: Taro のブラウザは**Eve のアカウントでログインした状態**になる
  7. Taro が気づかず、領収書の写真・クレジットカード・個人情報などを入力・アップロードする
  8. それらは**Eve のアカウントに保存**される → Eve が自分のアカウントにログインすれば全部見られる
- 被害のイメージ: **他人 (Eve) の家の鍵を渡されて、自分の家だと思い込んだまま荷物 (個人情報) を置いてくる**ようなもの
- 解決策: state
  1. Taro が正規にログインを始めるとき、アプリは**ランダムな値を作る**
     - 例: `state=abc123`
  2. その値を **Taro のブラウザのセッション (Cookie や sessionStorage) に保存**する
  3. 認可リクエストの URL に `state=abc123` を付ける
  4. Keycloak は何も加工せず、戻りの URL にそのまま付ける
     ```
     https://app.example.com/callback?code=...&state=abc123
     ```
  5. アプリは**戻ってきた `state` と、セッションに保存した値を比較**する
     - 一致 → 自分が始めたログイン。処理を続ける
     - 不一致、または state なし → **破棄してエラー**
- 同じ攻撃が state ありだとどうなるか
  - Eve の URL: `callback?code=EVE-CODE-123&state=eve-state-999`
  - Taro のセッションに保存されているのは `abc123` (または、そもそも何も保存されていない)
  - `eve-state-999` ≠ `abc123` → アプリが拒否 → **Taro は Eve のアカウントに入れられない**
  - Eve は Taro のセッションの中身 (保存された state) を**読めない** ので、一致する値を用意できない
- ポイント
  - state は**ただのランダム値**でよいが、**ユーザーのブラウザのセッションに紐付けて保存し、戻りで照合する**ことが肝心
  - 照合しないと意味がない (付けるだけでは何も守れない)
  - 推測されない長さのランダム値にする (例: 128bit 以上)
- state でできること (まとめ)
  - 第三者が作ったログイン完了 URL を踏まされても、アカウントを乗り換えられない
  - 古い・使い回しのレスポンスを受け付けない
- state にもう一つ使い道 (補足)
  - ログイン後に戻したいページ (例 `/orders/42`) を state に含めて運ぶことがある。その場合も、改ざんされないよう署名・保存側との照合を行う
- PKCE との違い
  - state = **戻ってきたレスポンスが自分宛か**を確かめる (アプリが自分で照合)
  - PKCE = **code を盗んだ人が token に交換できない**ようにする (Keycloak が照合)
  - 守っているものが別なので、両方使う
- Q. state は URL に付くのに、途中で盗まれたら意味がないのでは?
  - A. **その通り。盗まれると防御は破れる。ただし state が想定している攻撃者は、それができない相手**
  - state が守る相手 (CSRF の攻撃者 Eve) の能力
    - できる: Taro に**リンクを踏ませる** (リクエストを送らせる)
    - できない: **Taro のブラウザの通信やセッションの中身を見る**
    - だから Eve は、Taro のセッションに保存された `abc123` を知らず、一致する値を作れない
  - state が URL に出ても大丈夫な理由
    - HTTPS なので、**通信経路では盗聴されない**
    - state は**パスワードではなく、1回限りの照合用の値**。ログイン完了時にアプリが照合して**破棄 (使い捨て)** する → 後から見つかっても使えない
    - 有効期間が短い (ログインを始めてから完了するまでの数分)
  - 破れるケース
    - 攻撃者が**ログイン進行中に、被害者のブラウザの URL をリアルタイムで読める** (悪意ある拡張機能、XSS、同一端末のマルウェアなど)
    - その場合は `abc123` を知った上で `callback?code=EVE-CODE&state=abc123` を踏ませられ、state は突破される
    - ただしこの攻撃者は、**ブラウザを掌握済み**で、state 以外でもより大きな被害を出せる。state の守備範囲外
  - さらに守る方法 = **PKCE**
    - `code_verifier` (鍵) は**URL に出ない** (token 交換の直接通信でのみ送る)。URL に出るのはハッシュ (`code_challenge`) だけ
    - Eve の `code` は **Eve の challenge に結び付いている**。Taro のアプリが送る verifier とは合わず、Keycloak が**拒否**する
    - つまり **PKCE は CSRF 対策としても働く**。state よりも盗まれにくい (鍵が URL に出ない)
    - OAuth 2.1 / 最新のセキュリティ指針では、「PKCE を正しく使っていれば CSRF 対策としても足りる」とされるが、**state も併用するのが実務の定番**
  - まとめ: state = **URL に出る前提の、軽い照合札**。守りの本命は PKCE (鍵が URL に出ない)。両方で多層防御する
- 一言: **「このレスポンスは、私が出したリクエストの答えか?」を確認する**

### nonce (ID Token のリプレイ対策)
- 先に結論: **「このID Token は、今回自分が始めたログインのために作られたものか?」をアプリが確かめるための合言葉**
  - 名前の由来: "number used once" (1回だけ使う数)
- 用語: リプレイ (replay) = 過去に正規に発行された**有効なトークンを、別の場面で使い回す**攻撃
- 具体的な攻撃シナリオ (nonce が**無い**場合)
  - 登場人物: 攻撃者 Eve / 被害者 Taro / 経費アプリ
  1. 以前、Taro がログインしたときの **ID Token が Eve に漏れる**
     - 例: ログやプロキシの記録、メールに貼られたデバッグ出力、古いブラウザ履歴、サーバーの不備
     - 署名は Keycloak の本物で、`exp` が切れる前なら**検証を通ってしまう**
     ```json
     { "iss": "http://localhost:8080/realms/myrealm", "aud": "frontend-spa",
       "sub": "taro-uuid", "preferred_username": "taro", "exp": 1760003600 }
     ```
  2. Eve が自分のブラウザで経費アプリのログイン処理に入り込み、**そのID Token をアプリに差し込む**
     - 特にトークンが URL に載る方式 (Implicit / Hybrid Flow) で成立しやすい
  3. アプリは「署名OK、`iss` OK、`aud` OK、`exp` OK」と判断してしまう
  4. 結果: Eve が**Taro としてログインした状態**になる
- 問題の本質: 署名・`iss`・`aud`・`exp` は**「本物のトークンか」**しか示さない。**「今回のログインの結果か」は示さない**
- 解決策: nonce
  1. アプリはログインを始めるとき、**ログインごとに新しいランダム値**を作る
     - 例: `nonce=n-0S6_WzA2Mj`
  2. その値を**ブラウザのセッションに保存**し、認可リクエストに付ける
     ```
     GET /auth?client_id=frontend-spa&response_type=code&scope=openid&nonce=n-0S6_WzA2Mj&...
     ```
  3. Keycloak はこの値を**ID Token の中に `nonce` claim として埋め込み、署名**する
     ```json
     { "iss": "...", "aud": "frontend-spa", "sub": "taro-uuid", "nonce": "n-0S6_WzA2Mj", ... }
     ```
  4. アプリは ID Token を検証するとき、**`nonce` が保存した値と一致するか**確認する
     - 一致 → 今回のログインのトークン。受け入れる
     - 不一致、または nonce なし → **拒否**
- 同じ攻撃が nonce ありだとどうなるか
  - Eve が差し込むのは、**過去のログインで作られたトークン**
  - そのトークンの `nonce` は**過去のログインの値** (例 `old-nonce-111`)
  - 今回のセッションに保存されているのは `n-0S6_WzA2Mj` → **不一致 → 拒否**
  - Eve は nonce を書き換えられない (書き換えると**署名が壊れる**)
- なぜ署名があるのが重要か
  - nonce は **署名された ID Token の中**に入っている → 途中で差し替えられない
  - state は URL に付くだけで署名されていない。両者の守り方が違う
- 補足: 認可コードフロー (今回のメイン) での位置づけ
  - ID Token が `/token` から**直接 HTTPS で返る**ため、URL に載る方式より盗まれにくい
  - 仕様上、nonce が**必須なのは Implicit / Hybrid**、Authorization Code Flow では**任意だが推奨**
  - 実際のライブラリ (`oidc-client`, Spring Security, NextAuth 等) は、通常、自動で付けて検証する
  - 「付けておけば追加の防御になる。コストはほぼ無い」ので、付けるのが定石
- state との違い
  - | 項目 | state | nonce |
    |---|---|---|
    | 守る対象 | 戻りの **URL (リダイレクト)** | **ID Token** |
    | どこに入る | URL の `state=` | ID Token の `nonce` claim (署名される) |
    | 照合する場所 | コールバックを受けたとき | ID Token を検証するとき |
    | 防ぐもの | 他人が作ったログイン完了 URL を踏まされる (CSRF) | 古い・他人のトークンを差し込まれる (リプレイ) |
  - 両方付けるのが標準
- 手で確かめる
  - 第14章の Step 4 の URL に `nonce=n-0S6_WzA2Mj` が入っている
  - Step 5 で ID Token を decode して `"nonce": "n-0S6_WzA2Mj"` が入っているのを確認する
  - 別の値で認可リクエストを出し直すと、ID Token の nonce もその値に変わる (**ログインごとに変わる**)
- 一言: **「このトークンは、今回のログインのために作られたものか?」を確認する**

### PKCE (ピクシー: code の横取り対策)
- 先に結論: **「code を盗んでも、最初にログインを始めた本人 (アプリ) でなければ token に交換できない」ようにする仕組み**
  - 正式名: Proof Key for Code Exchange (RFC 7636)。読み方は「ピクシー」
- 前提: `code` は**ブラウザの URL を経由して戻ってくる**
  - つまり、URL が見える場所では盗まれうる (ブラウザ履歴、ログ、Referer、同じ端末の別アプリ、拡張機能)
- 具体的な攻撃シナリオ (PKCE が**無い** Public client の場合)
  - 登場人物: 攻撃者 Eve / 被害者 Taro / Taro のスマホの経費アプリ (Public client, secret なし)
  1. Eve は、Taro のスマホに**悪意あるアプリ**を入れさせる
     - このアプリも、経費アプリと**同じリダイレクト先** (カスタムスキーム `myapp://callback`) を宣言する
  2. Taro が経費アプリでログインする。Keycloak が `myapp://callback?code=TARO-CODE` へ戻す
  3. OS は**同じスキームを宣言した複数のアプリ**のうち、**悪意あるアプリに URL を渡してしまう**ことがある
  4. 悪意あるアプリは `code=TARO-CODE` を手に入れる
  5. Eve は token endpoint にこう送る
     ```
     POST /token
       grant_type=authorization_code
       client_id=frontend-spa
       code=TARO-CODE
       redirect_uri=myapp://callback
     ```
  6. **Public client は secret が無い**ので、Keycloak は本人確認の材料を持たず、そのまま token を発行する
  7. Eve が **Taro の Access Token を手に入れる**
  - 同様の横取りは、モバイルに限らず Web でも起こる (code が URL に残るため)
    - 例: アクセスログに `callback?code=...` が残る / 共有 PC のブラウザ履歴 / 悪意ある拡張機能
- 問題の本質: **code さえ持っていれば誰でも交換できる**。code を持つ人が正規のアプリかどうかを Keycloak が判断できない
- 解決策: PKCE (鍵と錠のたとえ)
  1. アプリは、ログインのたびに**秘密の乱数 `code_verifier` (鍵)** を作り、**自分の中にだけ**保存する
     - 例: `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`
  2. 鍵のハッシュ **`code_challenge` (錠)** を計算して、認可リクエストに付けて Keycloak に渡す
     - `code_challenge = BASE64URL( SHA256( code_verifier ) )`
     - 例: `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`
     - `code_challenge_method=S256` はハッシュ方式の指定
  3. Keycloak は**錠 (challenge) を code に結び付けて記憶**する
  4. ログイン後、code がアプリに戻る (ここは従来と同じ。**盗まれる可能性がある**)
  5. アプリが token 交換のとき、**鍵 (`code_verifier`) そのもの**を `/token` に送る
  6. Keycloak は、受け取った鍵を SHA-256 でハッシュし、記憶していた錠と**一致するか**確認
     - 一致 → token を発行 / 不一致 → `invalid_grant` ("PKCE verification failed")
- 同じ攻撃が PKCE ありだとどうなるか
  - Eve が盗めたのは `code=TARO-CODE` (と、URL に出ていた `code_challenge`)
  - Eve は token 交換に必要な **`code_verifier` を知らない**
    - 鍵は Taro の経費アプリの内部にあり、**URL にも認可リクエストにも出ていない**
  - 錠 (challenge) から鍵 (verifier) を逆算することは**できない** (SHA-256 は一方向)
  - Eve の交換リクエストは Keycloak の検証で**不一致 → 拒否**
  - code が盗まれても、**使えない**
- 通信の中での鍵の動き
  - | 段階 | 経路 | code_challenge (錠) | code_verifier (鍵) |
    |---|---|---|---|
    | 認可リクエスト | ブラウザ経由 (URL) | 出る | **出ない** |
    | code が戻る | ブラウザ経由 (URL) | - | **出ない** |
    | token 交換 | アプリ → Keycloak (直接 HTTPS) | - | **ここで初めて送る** |
  - 鍵が通るのは、**URL に出ない直接通信だけ**。ここが盗まれにくい
- なぜ `S256` (ハッシュ) が必要か
  - `code_challenge_method=plain` は challenge = verifier そのまま
    - 認可リクエスト (URL) を見られると、**鍵が丸見え**になる → 意味がない
  - 必ず **S256** を使う (Keycloak では PKCE Method を `S256` に設定すると強制できる)
- 手元で確かめる
  ```bash
  printf 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk' | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='
  # => E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  ```
  - 第14章の Step 4 では、この計算を自分で実行して認可 URL に埋め込む
  - 試してみること: `code_verifier` を別の値にして token 交換 → `PKCE verification failed`
- secret (Confidential) との違い
  - | 項目 | client secret | PKCE |
    |---|---|---|
    | 何を証明するか | **このクライアントアプリ (種類)** が本物 | **このログインを始めた個体**が今の送信者 |
    | 値の寿命 | 固定 (長期間同じ) | **ログインごとの使い捨て** |
    | Public client で使える? | ✕ (隠せない) | ○ |
    | 盗まれたら | 全ログインに影響 | その1回のログインだけ |
  - Confidential client でも PKCE を併用するのが推奨 (OAuth 2.1 では全クライアントで必須)
- state / nonce との違い (三つ組の整理)
  - | | 守る対象 | 攻撃の例 | 照合するのは |
    |---|---|---|---|
    | state | 戻りの URL | 他人が作ったログイン完了 URL を踏まされる | アプリ |
    | nonce | ID Token | 古い・他人のトークンを差し込まれる | アプリ |
    | PKCE | code | 盗んだ code を token に交換される | **Keycloak** |
- Keycloak での設定
  - Clients → 対象 → Advanced タブ → **Proof Key for Code Exchange Code Challenge Method** = `S256`
  - 設定すると、PKCE が付いていないリクエストは `Missing parameter: code_challenge_method` で**拒否**される
- 一言: **「code を盗まれても、鍵を持つ本人しか交換できない」ようにする**

### JWT / JWS / JWE (トークンの書式)
- **JWT (JSON Web Token)**: JSON の情報 (claim) を持ち運ぶ**書式**。「署名付きの書類」と思えばよい
  - 見た目: `xxxxx.yyyyy.zzzzz` (3つを `.` でつなぐ)
    - | 部分 | 中身 | 例 (Base64URL をデコードしたもの) |
      |---|---|---|
      | header | 署名方式と鍵 ID | `{"alg":"RS256","typ":"JWT","kid":"abc123"}` |
      | payload | claim (本体) | `{"iss":"...","sub":"...","aud":"...","exp":...}` |
      | signature | 改ざん防止の印 | (バイナリ) |
  - **暗号化ではない**。payload は誰でも decode して読める → **秘密情報を入れない**
- **JWS (JSON Web Signature)**: 「署名付き」の形式。**Keycloak の Access / ID Token は JWS 形式の JWT**
  - 署名の作り方 (RS256 = RSA + SHA-256)
    1. `base64url(header) + "." + base64url(payload)` を SHA-256 でハッシュ
    2. そのハッシュを Keycloak の**秘密鍵**で署名 → signature
  - 検証の仕方: 受け取った側が**公開鍵**で signature を確認 → 一致すれば「Keycloak が作った・改ざんされていない」
- **JWE (JSON Web Encryption)**: 「暗号化」形式。中身が読めなくなる。Keycloak は通常使わない (設定すれば可)
- 関係: JWT (中身の書式) ─署名すると→ JWS / ─暗号化すると→ JWE
### kid と JWKS (署名の検証に使う公開鍵)
- 問題: API はどうやって「Keycloak の公開鍵」を知り、「どの鍵で署名されたか」を判断するのか
- **JWKS (JSON Web Key Set)**: Keycloak が公開している**公開鍵の一覧** (JSON)
  - 場所: `GET /realms/myrealm/protocol/openid-connect/certs` (誰でも取得できる)
  - 例
    ```json
    { "keys": [
      { "kid": "abc123", "kty": "RSA", "alg": "RS256", "use": "sig", "n": "0vx7agoebGcQ...", "e": "AQAB" },
      { "kid": "def456", "kty": "RSA", "alg": "RSA-OAEP", "use": "enc", "n": "...", "e": "AQAB" }
    ] }
    ```
    - `kid` = 鍵の ID / `kty` = 鍵の種類 / `alg` = 用途のアルゴリズム
    - `use: "sig"` = **署名の検証用**、`enc` = 暗号化用 → 検証には sig を使う
    - `n`, `e` = RSA 公開鍵の本体 (数値)
- **kid (Key ID)**: 「どの鍵か」を示す**ラベル**
  - JWT の header に `"kid":"abc123"` と書かれている → JWKS の中から**同じ kid の鍵を探して**検証に使う
  - 鍵が複数あるのは、**ローテーション (鍵の入れ替え)** のため。旧鍵で署名した古いトークンも検証できる
- 検証の流れ
  ```
  API: token の header を読む ── kid = abc123
       │
       ▼
  JWKS (キャッシュ) から kid=abc123 の公開鍵を探す
       │  (無ければ JWKS を再取得)
       ▼
  公開鍵で signature を検証 ─ OK → payload を信用する / NG → 401
  ```
- 一言: **JWKS = 印鑑証明、kid = 「何番の印鑑か」の番号**
### Bearer token (持参人式の入場券)
- Bearer = 「持参人」。**持っている人は誰でも使える**という意味
  - 映画のチケットと同じ。本人確認なしで、持っていれば入れる
- 使い方: HTTP ヘッダに付ける
  ```
  GET /items HTTP/1.1
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...
  ```
- token レスポンスの `"token_type": "Bearer"` はこの意味。Access Token の `typ: Bearer` claim も同じ
- 弱点: **盗まれたらそのまま悪用される**
  - 対策: HTTPS 必須 / 寿命を短く (5分) / URL (クエリ文字列) に入れない / ログに出さない
  - 発展: DPoP や mTLS で**持ち主に紐づける** (Sender-constrained token)
- 他のトークン種別との違い
  - Access Token は Bearer として**API に送る**
  - Refresh Token は Bearer だが**Keycloak にしか送らない** (API に送らない)
### Introspection (トークンの有効確認窓口)
- 問題: JWT は `exp` までは**署名だけで有効に見える**。ログアウトや権限剥奪が即時に反映されない
- 仕組み: API が Keycloak に「このトークン、今も有効?」と**問い合わせる**
  ```
  POST /token/introspect   (API 自身の client 認証 + token=<access_token>)
  → {"active": true,  "sub": "...", "scope": "...", "aud": [...]}   有効
  → {"active": false}                                                 無効 (期限切れ・ログアウト・失効)
  ```
- ローカル検証 (JWKS) との使い分け
  - ローカル: 速い・Keycloak に負荷なし・失効は `exp` まで気づかない
  - Introspection: 即時反映・毎回通信が必要
  - 詳細とシーケンス図は第8章
### まとめ: 1回のログインから API 呼び出しまで
- シーケンス図 (state / nonce / PKCE / JWT 署名 / JWKS / Bearer / introspection の位置づけ)
  ```
     App(Client)                                Keycloak                                       API
      |                                             |                                           |
      | [0. make state, nonce, code_verifier]       |                                           |
      | [   code_challenge = SHA256(verifier)]      |                                           |
      |-- 1. GET /auth state,nonce,challenge ------>|                                           |
      |                                             | [user logs in; Keycloak stores challenge] |
      |<- 2. 302 redirect_uri?code=..&state=.. -----|                                           |
      | [3. state matches the saved one?]           |                                           |
      |-- 4. POST /token code,verifier ------------>|                                           |
      |                                             | [5. SHA256(verifier) == challenge ?]      |
      |                                             | [   sign tokens with private key (kid)]   |
      |<- 6. access/id/refresh token (JWT) ---------|                                           |
      | [7. ID Token: verify signature by JWKS]     |                                           |
      | [   check nonce, iss, aud, exp]             |                                           |
      |                                             |                                           |
      |-- 8. GET /items  Authorization: Bearer <AT> ------------------------------------------->|
      |                                             |<- (first time only) GET /certs -> JWKS ---|
      |                                             |         [9. find key by kid (JWKS cache)] |
      |                                             |      [   verify signature, iss, aud, exp] |
      |                                             |         [   check role (resource_access)] |
      |<- 10. 200 JSON -------------------------------------------------------------------------|
      |                                             |                                           |
      |                                             |         [(option) POST /token/introspect] |
      |                                             |             [  -> {"active": true/false}] |
  ```
- 読み方
  - 0〜3: **state** と **PKCE** の準備と照合 (アプリ側)
  - 4〜5: Keycloak が **code_verifier** を検証 (PKCE)
  - 6: **JWT (JWS 署名、kid 付き)** を受け取る
  - 7: ID Token を **JWKS** で署名検証し、**nonce** を照合
  - 8: **Bearer token** で API を呼ぶ
  - 9: API が **kid → JWKS の公開鍵**で署名検証し、`iss` / `aud` / `exp` / ロールを確認 (JWKS は初回だけ取得してキャッシュ)
  - (option): 即時失効を反映したいときは **introspection**

### 7-1. Authorization Code Flow (+ PKCE) ★最重要
- 登場人物: User / Browser / Client App / Keycloak
- 手順
  1. ユーザーが「ログイン」をクリック
  2. **(PKCE)** クライアントが `code_verifier` をランダム生成し、`code_challenge = BASE64URL(SHA256(code_verifier))` を作る
     - verifier 例: `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`
     - challenge 例: `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`
  3. ブラウザを Keycloak の authorization endpoint へリダイレクト
     ```
     GET /realms/myrealm/protocol/openid-connect/auth
       ?client_id=frontend-spa
       &response_type=code
       &redirect_uri=http://localhost:3000/callback
       &scope=openid profile email
       &state=xyz123
       &nonce=n-0S6_WzA2Mj
       &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
       &code_challenge_method=S256
     ```
     - `state` = CSRF 対策 (戻ってきた値を照合)
     - `nonce` = ID Token のリプレイ対策
  4. Keycloak がログイン画面を表示 → ユーザーが ID/パスワード (+MFA) 入力
     - Keycloak 側に SSO Cookie (`KEYCLOAK_IDENTITY` 等) が作られる
     - 2 回目以降は SSO Cookie があれば画面なしで即リダイレクト
  5. Keycloak がブラウザを redirect_uri にリダイレクト
     ```
     HTTP/1.1 302 Found
     Location: http://localhost:3000/callback?code=7a3f...&state=xyz123&session_state=...&iss=http://localhost:8080/realms/myrealm
     ```
     - `code` = **ワンタイム・短命 (約1分)** の引換券。トークンそのものではない
     - アプリは `state` 一致を確認
  6. クライアントが token endpoint に **直接 (バックチャネル)** で code を交換
     - Public (OFF)
       ```
       POST /realms/myrealm/protocol/openid-connect/token
       Content-Type: application/x-www-form-urlencoded

       grant_type=authorization_code
       &client_id=frontend-spa
       &code=7a3f...
       &redirect_uri=http://localhost:3000/callback
       &code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
       ```
     - Confidential (ON) は `Authorization: Basic base64(backend-web:s3cr3t)` を追加
  7. Keycloak が検証
     - code が有効・未使用か
     - redirect_uri が認可リクエスト時と同一か
     - SHA256(code_verifier) == 保存済み code_challenge か
     - (ON なら) client secret が正しいか
  8. レスポンス
     ```json
     {
       "access_token": "eyJhbGciOiJSUzI1NiIs...",
       "expires_in": 300,
       "refresh_expires_in": 1800,
       "refresh_token": "eyJhbGciOiJIUzUxMiIs...",
       "token_type": "Bearer",
       "id_token": "eyJhbGciOiJSUzI1NiIs...",
       "not-before-policy": 0,
       "session_state": "e0f1a2b3-....",
       "scope": "openid profile email"
     }
     ```
  9. クライアントが **ID Token を検証** (署名, iss, aud=自分の client_id, exp, nonce)
  10. API 呼び出し
      ```
      GET https://api.example.com/items
      Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
      ```
  11. API (Resource Server) が **Access Token を検証** (第8章)
- なぜ code を挟む?
  - アクセストークンをブラウザの URL (履歴・ログ・Referer) に出さないため
- Implicit Flow との違い
  - Implicit は URL fragment に直接トークン → 漏れやすく**廃止方向**
- シーケンス図
  ```
  User/Browser        Client App            Keycloak            API
      │  click login     │                     │                 │
      │─────────────────>│ gen verifier/challenge                │
      │<─ 302 /auth?...challenge ──────────────│                 │
      │──────────────── GET /auth ────────────>│                 │
      │<──────────── login page ───────────────│                 │
      │── username/password ──────────────────>│                 │
      │<─ 302 redirect_uri?code=..&state=.. ───│                 │
      │─────────────────>│ POST /token (code + verifier)         │
      │                  │────────────────────>│ verify          │
      │                  │<── access/id/refresh│                 │
      │                  │── GET /items  Authorization: Bearer ─>│
      │                  │<────────────── 200 ───────────────────│
  ```
- シーケンス図 (Confidential: backend-web の場合。SPA 版との違いは token 交換で secret を使い、トークンをサーバーに置く点)
  ```
  User/Browser     Web App (server)        Keycloak              API
      │ click login      │                    │                   │
      │─────────────────>│                    │                   │
      │<─ 302 /auth?client_id=backend-web&state=..&redirect_uri=..│
      │────────────── GET /auth ─────────────>│                   │
      │<───────────── login page ─────────────│                   │
      │── username/password ─────────────────>│                   │
      │<─ 302 redirect_uri?code=..&state=.. ──│                   │
      │─────────────────>│ POST /token        │                   │
      │                  │  Authorization: Basic (client:secret)  │
      │                  │  code, redirect_uri│                   │
      │                  │───────────────────>│ verify code+secret│
      │                  │<─ access/id/refresh│                   │
      │                  │ (tokens kept on SERVER; browser gets only a session Cookie)
      │<─ Set-Cookie: session ─│              │                   │
      │── page request (Cookie) ─>│           │                   │
      │                  │── GET /items  Authorization: Bearer ──>│
      │                  │<───────────────── JSON ────────────────│
      │<─ rendered page ─│                    │                   │
  ```

### 7-2. Client Credentials Flow (Client auth ON 必須)
- 用途: ユーザー不在のサーバー間 (バッチ, マイクロサービス間)
- 準備: Client Authentication ON + Service accounts roles ON
  - Service Account Roles タブで role を付与
- リクエスト
  ```bash
  curl -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
    -u 'batch-job:s3cr3t' \
    -d grant_type=client_credentials \
    -d scope=openid
  ```
- レスポンス: access_token のみ (refresh_token・id_token は基本なし)
- claim の特徴
  - `sub` = service-account-batch-job ユーザーの UUID
  - `preferred_username` = `service-account-batch-job`
  - `azp` = `batch-job`, `clientId` / `client_id` claim が入ることも
- `aud` が足りなければ Audience Mapper で `backend-api` を追加
- シーケンス図
  ```
  Batch (batch-job)                 Keycloak                    API (backend-api)
        │                              │                              │
        │ POST /token                  │                              │
        │  Authorization: Basic (client:secret)                       │
        │  grant_type=client_credentials                              │
        │─────────────────────────────>│                              │
        │                              │ verify client + secret       │
        │                              │ load Service Account roles   │
        │<── access_token (no refresh/id token)                       │
        │                              │                              │
        │ GET /items  Authorization: Bearer <access_token>            │
        │────────────────────────────────────────────────────────────>│
        │                              │   verify sign / iss / aud    │
        │<──────────────────────────── JSON ──────────────────────────│
        │ (expired -> just call POST /token again; no user involved)  │
  ```

### 7-3. Refresh Token Flow
- Access Token 失効時に再取得
  ```bash
  curl -X POST .../token \
    -d grant_type=refresh_token \
    -d client_id=frontend-spa \
    -d refresh_token=eyJhbGciOiJIUzUx...
  ```
- Confidential は secret も必要
- Refresh Token Rotation
  - Realm setting「Revoke Refresh Token」ON で使い捨て
  - Public client は新 Refresh Token を毎回受け取る
- Refresh が失敗 → `invalid_grant` ("Session not active" / "Token is not active")
  - → 再ログインへ
- シーケンス図
  ```
  Client App                         Keycloak                     API
      │ GET /items (Bearer old token) ─────────────────────────────>│
      │<──────────────── 401 (token expired) ────────────────────────│
      │                                 │                            │
      │ POST /token                     │                            │
      │  grant_type=refresh_token       │                            │
      │  client_id (+secret if ON)      │                            │
      │  refresh_token=...              │                            │
      │────────────────────────────────>│ check session is alive     │
      │                                 │ (Rotation ON: old RT revoked)
      │<── new access_token (+ new refresh_token) ──                 │
      │ GET /items (Bearer new token) ──────────────────────────────>│
      │<───────────────────────── 200 JSON ──────────────────────────│
      │                                 │                            │
      │ [if RT expired / session ended]                              │
      │<── 400 invalid_grant ("Session not active")                 │
      │ -> redirect user to /auth for re-login                       │
  ```

### 7-4. Resource Owner Password Credentials (Direct Access Grants) ※非推奨
- アプリがユーザーの ID/PW を直接受け取る
  ```bash
  curl -X POST .../token \
    -d grant_type=password -d client_id=frontend-spa \
    -d username=taro -d password=pass1234 -d scope=openid
  ```
- OAuth 2.1 で廃止。テスト・移行用途のみ
- MFA/SSO/ソーシャルログインが使えない
- シーケンス図
  ```
  User          App (login form)               Keycloak
   │ id/pw input ───>│                            │
   │                 │ POST /token                │
   │                 │  grant_type=password       │
   │                 │  username, password        │
   │                 │───────────────────────────>│ verify id/pw
   │                 │                            │ (no login screen, no MFA/SSO)
   │                 │<── access / refresh token ─│
   │<── logged in ───│                            │
   ※ the app sees the user's password itself -> why this flow is deprecated
  ```

### 7-5. Device Authorization Grant
- 用途: TV, CLI, IoT (ブラウザ入力が困難)
- 手順
  1. デバイスが `POST /auth/device` (`client_id=cli-tool`)
     ```json
     { "device_code": "GmRh...", "user_code": "WDJB-MJHT",
       "verification_uri": "http://localhost:8080/realms/myrealm/device",
       "verification_uri_complete": "http://localhost:8080/realms/myrealm/device?user_code=WDJB-MJHT",
       "expires_in": 600, "interval": 5 }
     ```
  2. 画面に「別端末で verification_uri を開き WDJB-MJHT を入力」と表示
  3. ユーザーがスマホ等でログイン・承認
  4. デバイスは `interval` 秒ごとに token endpoint をポーリング
     ```
     grant_type=urn:ietf:params:oauth:grant-type:device_code
     &device_code=GmRh...&client_id=cli-tool
     ```
     - 承認前: `authorization_pending` / 早すぎ: `slow_down`
- シーケンス図
  ```
  CLI/TV (device)         Keycloak              User's phone/PC
       │ POST /auth/device    │                       │
       │  client_id=cli-tool  │                       │
       │─────────────────────>│                       │
       │<─ device_code, user_code=WDJB-MJHT,          │
       │   verification_uri, interval=5               │
       │ show on screen:                              │
       │  "Open verification_uri, enter WDJB-MJHT"    │
       │                      │<── open verification_uri
       │                      │<── enter user_code ───│
       │                      │<── login + approve ───│
       │ POST /token (device_code)  every 5 sec       │
       │─────────────────────>│                       │
       │<─ 400 authorization_pending (not yet)        │
       │ ... repeat ...       │                       │
       │ POST /token (device_code)                    │
       │─────────────────────>│ approved!             │
       │<─ access / refresh token                     │
  ```

### 7-6. Token Exchange
- あるトークンを別の audience / 別ユーザー / 別 IdP 用トークンに交換
- v26.2 で **Standard Token Exchange** (RFC 8693, 内部↔内部) が正式対応
  ```bash
  curl -X POST .../token \
    -u 'service-a:secret' \
    -d grant_type=urn:ietf:params:oauth:grant-type:token-exchange \
    -d subject_token=eyJ... \
    -d subject_token_type=urn:ietf:params:oauth:token-type:access_token \
    -d audience=service-b
  ```
- 用途: マイクロサービスの下流呼び出し (On-Behalf-Of)
- シーケンス図
  ```
  Service A (azp)                  Keycloak                    Service B
       │ (holds user's access token: aud=service-a)               │
       │ POST /token                  │                           │
       │  Authorization: Basic (service-a:secret)                 │
       │  grant_type=token-exchange   │                           │
       │  subject_token=<user token>  │                           │
       │  audience=service-b          │                           │
       │─────────────────────────────>│ check: A may exchange?    │
       │                              │ check: subject_token valid│
       │<── new access_token (aud=service-b, sub=same user)       │
       │ GET /data  Authorization: Bearer <new token>             │
       │─────────────────────────────────────────────────────────>│
       │<──────────────────────── JSON ───────────────────────────│
  ```

### 7-7. Logout
- RP-Initiated Logout
  ```
  GET /realms/myrealm/protocol/openid-connect/logout
    ?id_token_hint=eyJ...
    &post_logout_redirect_uri=http://localhost:3000/
    &state=abc
  ```
  - `id_token_hint` か `client_id` が必要 (v18+)
  - post_logout_redirect_uri は「Valid post logout redirect URIs」に登録必須
- Back-Channel Logout
  - Keycloak → アプリのサーバーへ `logout_token` (JWT) を POST
- Front-Channel Logout
  - iframe 経由
- Refresh Token を直接失効: `POST /logout` に refresh_token
- シーケンス図
  ```
  [A] RP-Initiated Logout (browser)
  User/Browser          App                    Keycloak
      │ click logout      │                        │
      │──────────────────>│ clear app session      │
      │<─ 302 /logout?id_token_hint=..&post_logout_redirect_uri=..
      │────────────── GET /logout ───────────────>│ end SSO session
      │                                            │ (other apps' sessions are notified, see B/C)
      │<─ 302 post_logout_redirect_uri ────────────│
      │──────────────────>│ show "logged out"      │

  [B] Back-Channel Logout (Keycloak -> app server)
  Keycloak                         Other App (server)
      │ POST backchannel_logout_url      │
      │  logout_token (JWT: sid, sub)    │
      │─────────────────────────────────>│ find session by sid -> destroy
      │<──────────────── 200 ────────────│

  [C] Front-Channel Logout
  Browser(in Keycloak logout page)   Other App
      │ iframe GET frontchannel_logout_url ─>│ destroy session (Cookie)
  ```

### 7-8. SAML SSO (参考)
- SP-initiated: SP → AuthnRequest → Keycloak(IdP) → ログイン → SAMLResponse (署名付き XML) を SP に POST
- OIDC との対応: Assertion ≈ ID Token, Entity ID ≈ client_id, ACS URL ≈ redirect_uri
- シーケンス図
  ```
  User/Browser           SP (app)                Keycloak (IdP)
      │ access protected page │                       │
      │──────────────────────>│                       │
      │<─ 302 to IdP SSO URL + SAMLRequest (AuthnRequest)
      │────────────── GET /protocol/saml?SAMLRequest ─>│
      │<─────────────── login page ───────────────────│
      │── username/password ─────────────────────────>│
      │<─ HTML form w/ SAMLResponse (signed Assertion) ─│
      │── POST SAMLResponse to ACS URL ──>│           │
      │                       │ verify signature,     │
      │                       │ read Assertion        │
      │<─ session established ─│                      │
  ```

### 7-9. Identity Brokering (外部 IdP ログイン)
- 流れ: アプリ → Keycloak → (Google 等へ転送) → Google でログイン → Keycloak に戻る → Keycloak がアプリ用トークンを新規発行
- アプリは Keycloak しか知らなくてよい
- First Login Flow でユーザーを自動作成/既存とリンク
- Identity Provider Mapper で Google の属性 → Keycloak ユーザー属性
- シーケンス図
  ```
  User/Browser         App          Keycloak (broker)          Google (external IdP)
      │ click login      │                │                         │
      │─────────────────>│ 302 /auth      │                         │
      │──────────────────────────────────>│                         │
      │<─ login page ("Sign in with Google" button) ─│              │
      │── choose Google ─────────────────>│                         │
      │<─ 302 Google /auth?client_id=keycloak&redirect_uri=KC/broker/google/endpoint
      │───────────────────────────────────────────────────────────>│
      │<───────────────────── Google login page ───────────────────│
      │── Google id/pw (+consent) ────────────────────────────────>│
      │<─ 302 KC/broker/google/endpoint?code=G-code ───────────────│
      │──────────────────────────────────>│ POST Google /token (G-code)
      │                                   │──────────────────────────>│
      │                                   │<─ Google id_token ───────│
      │                                   │ First login flow:        │
      │                                   │  create / link KC user   │
      │                                   │ IdP Mapper: attrs -> user│
      │<─ 302 app redirect_uri?code=KC-code ──│                      │
      │─────────────────>│ POST /token (KC-code)                     │
      │                  │──────────────────>│ issue KC's OWN tokens │
      │                  │<─ access/id/refresh (iss=Keycloak)        │
      ※ the app only talks to Keycloak; Google's token never reaches the app
  ```

## 8. API 側でのトークン検証
### JWT をローカル検証 (高速・推奨)
- 1. JWKS を取得してキャッシュ
  - `GET /realms/myrealm/protocol/openid-connect/certs`
  - 例: `{"keys":[{"kid":"abc123","kty":"RSA","alg":"RS256","use":"sig","n":"...","e":"AQAB"}]}`
- 2. header の `kid` に合う公開鍵で**署名検証**
- 3. claim 検証チェックリスト
  - `alg` を固定 (RS256 など。`none` を許さない)
  - `iss` == `http://localhost:8080/realms/myrealm`
  - `aud` に自分 (`backend-api`) が含まれる
  - `exp` / `nbf` が現在時刻 (+許容clock skew) 内
  - `typ` == `Bearer`
  - `azp` が許可クライアントか (必要なら)
  - 必要な `scope` / role を持つか
- 4. 認可
  - `resource_access.backend-api.roles` に `write` があるか、など
- シーケンス図 (ローカル検証)
  ```
  Client App          API (backend-api)                Keycloak
      │                      │                            │
      │ GET /items           │                            │
      │ Authorization: Bearer <access_token>              │
      │─────────────────────>│                            │
      │                      │ [first time / unknown kid only]
      │                      │ GET /certs (JWKS)          │
      │                      │───────────────────────────>│
      │                      │<── public keys (kid, n, e)─│
      │                      │ cache the keys             │
      │                      │                            │
      │                      │ 1. read header: alg=RS256, kid=abc123
      │                      │ 2. pick the key with the same kid
      │                      │ 3. verify the signature   -> NG: 401
      │                      │ 4. iss == http://localhost:8080/realms/myrealm ? -> NG: 401
      │                      │ 5. aud contains "backend-api" ?   -> NG: 401 (or 403)
      │                      │ 6. exp / nbf are valid ?          -> NG: 401
      │                      │ 7. typ == Bearer ?                -> NG: 401
      │                      │ 8. required role / scope ?        -> NG: 403
      │                      │    (resource_access.backend-api.roles has "read")
      │<── 200 JSON ─────────│                            │
      │                      │                            │
      │  ※ no call to Keycloak per request (fast).         │
      │  ※ revoked tokens still pass until exp.            │
      │  ※ unknown kid (after key rotation) -> re-fetch JWKS once
  ```
### Introspection (サーバーへ問い合わせ)
- 即時失効 (ログアウト・ロール剥奪) を反映したいとき
  ```bash
  curl -X POST .../token/introspect \
    -u 'backend-api:secret' \
    -d token=eyJ...
  ```
  - 返り: `{"active": true, "sub": "...", "scope": "...", ...}`
  - 失効済み: `{"active": false}`
- 呼ぶ側 (API) は Confidential client が必要
- シーケンス図 (Introspection)
  ```
  Client App          API (backend-api)                Keycloak
      │ GET /items  Bearer <token>                        │
      │─────────────────────>│                            │
      │                      │ POST /token/introspect     │
      │                      │  Authorization: Basic (backend-api:secret)
      │                      │  token=<access_token>      │
      │                      │───────────────────────────>│ verify client auth
      │                      │                            │ check signature, exp,
      │                      │                            │ session alive, not revoked
      │                      │<── {"active":true,"sub":..,"scope":..,"aud":..}
      │                      │ check aud / role from response
      │<── 200 JSON ─────────│                            │
      │                      │                            │
      │ [after logout / role removal]                     │
      │ GET /items  Bearer <same token>                   │
      │─────────────────────>│ POST /token/introspect ───>│
      │                      │<── {"active":false}        │
      │<── 401 ──────────────│                            │
      │  ※ immediate revocation, but one extra call per request
  ```
### Userinfo
- `GET /userinfo` + Bearer → プロフィール claim を取得
### 比較
- ローカル JWT 検証: 速い / 失効に気づかない (exp まで)
- Introspection: 遅い / 即時反映
### 実装例
- Spring Security: `spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/myrealm`
  - issuer-uri から discovery → JWKS を自動取得、iss も自動検証
  - aud 検証は別途 `JwtValidator` を追加
- Node: `jose` の `createRemoteJWKSet` + `jwtVerify(token, jwks, {issuer, audience})`
- Go: `coreos/go-oidc`
- Python: `PyJWT` + `PyJWKClient`

## 9. ユーザー・ロール・グループ
### User (ユーザー)
- **何か**: ログインする人(や、後述の Service Account)
- 主な項目
  - **Username**: ログイン名。realm 内で一意 (`preferred_username` claim になる)
  - **Email / First name / Last name**: 基本プロフィール (`email`, `given_name`, `family_name`)
  - **Email verified**: メール確認済みか (`email_verified`)
  - **Enabled**: OFF でログイン不可
  - **Attributes**: 管理者が自由に足せる key-value (部署など)。User Attribute Mapper で claim にできる
  - **Credentials タブ**: パスワード、OTP、パスキー(WebAuthn)の登録・リセット
  - **Required user actions**: 次回ログイン時に必ずやらせること (後述)
  - **Role mapping タブ**: 付与されているロール
  - **Groups タブ**: 所属グループ
  - **Sessions / Consents タブ**: ログイン中セッションの確認・強制終了 / 同意の履歴
  - **Identity provider links**: Google など外部アカウントとの紐付け
- User Profile (Realm settings)
  - 「どの項目を必須にするか」「ユーザー自身が編集可か」を定義する機能(v24+で標準)
### Role (ロール)
- **何か**: 「何をしてよいか」を表す**名前付きのラベル**。例 `admin`, `read`
- 種類
  - **Realm Role**
    - realm 全体で共通のロール。例 `admin`, `user`
    - トークンでは `realm_access.roles`
  - **Client Role**
    - 特定のクライアント(アプリ/API)専用のロール。例 `backend-api` の `read`
    - トークンでは `resource_access.backend-api.roles`
    - 「このアプリ内の権限」を表すときに使うと名前の衝突を避けられる
  - **Composite Role (複合ロール)**
    - 他のロールを**束ねたロール**。例 `manager` = `read` + `write` + `approve`
  - **Default Roles**
    - 新規ユーザーに**自動付与**されるロール (`default-roles-myrealm`)。`offline_access` 等が含まれる
- 付ける場所: ユーザー / グループ / (Service Account)
- 重要: ロールは**「付与」されただけではトークンに載らない場合がある**
  - Client Scope の Role scope mapping / Full Scope Allowed の影響を受ける → 第4章
### Group (グループ)
- **何か**: ユーザーをまとめる入れ物。**階層構造**が作れる (`/company/dev`)
- できること
  - グループにロールを付ける → メンバー全員に継承される
  - グループに属性を持たせる → メンバーに継承される
- 使い分け目安
  - **組織・チームの所属** = Group / **権限の種類** = Role
  - 例: グループ `/sales` にロール `crm-user` を付ける → 営業全員が CRM を使える
- トークンに載せるには **Group Membership Mapper** が必要 (自動では載らない)
### Service Account (サービスアカウント)
- **何か**: Client Credentials Flow 用に Keycloak が**クライアントごとに自動作成する内部ユーザー**
- 名前: `service-account-<client_id>`
- ロールは Client の「Service accounts roles」タブで付ける
### Required Actions (必須アクション)
- **何か**: ユーザーが次回ログインしたとき、**ログイン前に必ずやらせる作業**
- 例
  - **Update Password**: パスワード変更
  - **Verify Email**: メール確認
  - **Configure OTP**: ワンタイムパスワード設定
  - **Update Profile**: プロフィール入力
  - **Terms and Conditions**: 利用規約への同意
- 残っていると `Account is not fully set up` で詰まることがある
### Organizations (v26)
- **何か**: B2B 向け。顧客企業(組織)ごとにユーザーとログイン元 IdP をまとめる機能
- メンバーの所属組織を `organization` claim で返せる
### ロール設計の指針
- API ごとに Client Role を作る → `aud` と自然に整合する
- 人の所属は Group、権限は Role にして、Group に Role を付ける
- 管理しやすいよう Composite Role で「職務ロール」を作る

## 10. 認証フロー (Authentication Flows)
### Authentication Flow とは
- **何か**: ログイン時に**どの確認をどの順番でやるか**を定義した手順書
- 場所: Authentication → Flows
- 例: 「Cookie があれば即ログイン → 無ければ ID/パスワード → 必要なら OTP」
- OAuth の「Flow」(Auth Code Flow 等) とは**別物**
  - OAuth Flow = アプリとの**通信手順**
  - Authentication Flow = **本人確認の手順**(Keycloak 内部の画面遷移)
### 構成要素
- **Flow**: 手順全体 (例 `browser`)
- **Sub-flow**: 手順の中のグループ化 (例 `forms`)
- **Execution**: 1つの確認ステップ (例 「Username Password Form」「OTP Form」)
- **Requirement** (各ステップの扱い)
  - **Required**: 必ず成功させる
  - **Alternative**: 並んだ候補のうち**どれか1つ**成功すればよい (Cookie / Passkey / パスワード 等)
  - **Conditional**: 条件(Condition)を満たす時だけ実行
  - **Disabled**: 無効
### 標準で入っているフロー
- **browser**: ブラウザでのログイン画面の手順 (一番よく使う)
  - Cookie (SSO 済みなら画面なし) → Identity Provider Redirector → Username/Password → (条件付き) OTP
- **direct grant**: Password Grant 用 (画面なし)
- **registration**: 新規ユーザー登録
- **reset credentials**: パスワード忘れの再設定
- **first broker login**: 外部 IdP で**初めて**ログインしたときの処理 (ユーザー作成 or 既存と紐付け)
- **post broker login**: 外部 IdP ログイン後の追加処理
- **clients**: クライアント認証の手順 (secret / JWT / mTLS)
- **docker auth** / **http challenge**: 特殊用途
- 標準フローは**直接編集できない**。Duplicate してコピーを編集 → Bind flow で適用
### 主な Execution (ステップ部品)
- **Cookie**: SSO Cookie があればログイン済みとして通す
- **Identity Provider Redirector**: 指定した外部 IdP へ自動で転送
- **Username Password Form**: ID とパスワードの入力画面
- **OTP Form**: ワンタイムパスワード入力
- **WebAuthn Authenticator / Passkeys**: 指紋・セキュリティキー・パスキー
- **Recovery Authentication Code Form**: バックアップコード
- **Conditional OTP / Condition - user role** 等: 「このロールの人だけ OTP」などの条件
### 認証強化の機能
- **MFA (多要素認証)**
  - TOTP (Google Authenticator 等の6桁コード)、WebAuthn/Passkeys、リカバリーコード
- **Step-up Authentication (段階的認証)**
  - 重要な操作の時だけ強い認証を要求する
  - アプリが `acr_values=gold` のように要求 → Keycloak が MFA を追加で実施 → `acr` claim に反映
  - Realm settings の「ACR to LoA mapping」で `gold` = Level 2 のように対応づける
- **Brute Force Detection**
  - 連続ログイン失敗でアカウントを一時/永久ロック (Realm settings → Security defenses)
- **Password Policy**
  - 最小長、大文字小文字、過去パスワードの再利用禁止、ユーザー名と同じ禁止 など (Authentication → Policies)
### 設定例: 「管理者ロールの人だけ MFA を必須にする」
- browser フローを Duplicate
- forms の中に Sub-flow「Admin OTP」を追加 (Requirement=Conditional)
- Sub-flow 内に「Condition - user role (admin)」=Required と「OTP Form」=Required
- Bind flow で browser フローに設定

## 11. User Federation (LDAP / AD)
### User Federation とは
- **何か**: 会社にすでにある**ユーザー名簿 (LDAP / Active Directory)** を Keycloak につなぐ機能
- 目的: ユーザーを作り直さず、既存の ID/パスワードで Keycloak にログインさせる
- 流れ: ログイン時、Keycloak が LDAP に「このパスワードで合ってる?」と問い合わせる
### 用語
- **LDAP**: ユーザー情報を階層構造で持つディレクトリの標準プロトコル
- **Active Directory (AD)**: Microsoft の LDAP 互換ディレクトリ。Windows ドメインのユーザー名簿
- **Bind DN / Bind credential**: Keycloak が LDAP に接続するための管理用アカウント
- **Users DN**: ユーザーが入っている LDAP 上の場所(例 `ou=people,dc=example,dc=com`)
### 主な設定項目
- **Vendor**: Active Directory / Red Hat DS など(属性名の既定値が変わる)
- **Connection URL**: `ldap://ldap.example.com:389` / `ldaps://...:636` (暗号化)
- **Edit mode** (Keycloak から LDAP を変更してよいか)
  - **READ_ONLY**: 読み取りのみ(パスワード変更も不可)
  - **WRITABLE**: Keycloak での変更を LDAP に書き戻す
  - **UNSYNCED**: 変更は Keycloak 内だけに保存し LDAP に反映しない
- **Import Users**: ON なら LDAP ユーザーを Keycloak DB にコピーして使う(OFF は毎回 LDAP 参照)
- **Synchronization Settings**
  - **Periodic Full Sync**: 定期的に全ユーザーを同期
  - **Periodic Changed Users Sync**: 変更分だけ同期
### LDAP Mapper (属性の対応づけ)
- **user-attribute-ldap-mapper**: LDAP の属性 → Keycloak ユーザー属性 (例 `mail` → `email`)
- **group-ldap-mapper**: LDAP グループ → Keycloak グループ
- **role-ldap-mapper**: LDAP グループ → Keycloak ロール
- (第4章の Protocol Mapper とは別物。これは「LDAP → Keycloak ユーザー」の変換)
### その他
- **Kerberos / SPNEGO**: Windows ドメインにログイン済みなら、パスワード入力なしでブラウザから自動ログイン
- **User Storage SPI**: 独自 DB など任意のユーザー保管先をつなぐ拡張 (Java で実装)
- User Federation と Identity Brokering の違い
  - Federation = **名簿を Keycloak が直接読む**(ログイン画面は Keycloak)
  - Brokering = **ログインを外部 IdP に任せる**(画面も外部へ転送)

## 12. セキュリティ・運用
### 本番で守ること (理由つき)
- **HTTPS 必須**
  - 理由: トークンやパスワードが盗聴されるため。`KC_HOSTNAME` や `KC_PROXY_HEADERS` で外向き URL を正しく伝える
- **`start-dev` は開発専用**
  - 理由: HTTP 許可・キャッシュ無効など安全でない既定。本番は `start` + `kc.sh build`
- **`master` realm を業務に使わない**
  - 理由: master は全 realm の管理権限につながる。業務ユーザーは別 realm に
- **Valid redirect URIs でワイルドカードを避ける**
  - 理由: 攻撃者の URL に code が流れる(オープンリダイレクト)のを防ぐ
- **Implicit / Password Grant は OFF**
  - 理由: トークン露出・ID/PW をアプリが扱う危険
- **SPA は Public + PKCE (S256)**、可能なら BFF 化
  - 理由: ブラウザには secret を隠せない。BFF ならトークンをブラウザに出さずに済む
- **Access Token を短命に** + Refresh Token Rotation
  - 理由: 盗まれても使える時間を短くする
- **secret は Git に入れない**(シークレット管理サービスや環境変数で渡す)
### 鍵管理 (Realm settings → Keys)
- Keys タブの **Keys list**: 現在の署名鍵一覧(`kid`, 有効期限, アルゴリズム)
- **Providers**
  - `rsa-generated`: Access/ID Token の**署名用** RSA 鍵(自動生成)
  - `rsa-enc-generated`: **暗号化用** RSA 鍵
  - `hmac-generated-hs512`: Refresh Token 等の署名用(共通鍵)
  - `aes-generated`: 内部用の暗号化鍵
- **Priority**: 同じ種類の鍵が複数あるとき、**数字が大きい鍵**で署名する
- **Active / Passive / Disabled**
  - Active = 署名にも検証にも使う / Passive = **検証だけ**に使う / Disabled = 使わない
- ローテーションの手順
  1. 新しい鍵を作り Priority を高くする(以降の署名は新鍵)
  2. 旧鍵を Passive にする(旧鍵で署名済みのトークンはまだ検証できる)
  3. トークンが全部失効する時間を待って旧鍵を削除
- API 側は JWKS を**定期的に再取得**し、`kid` で鍵を選ぶこと
### 監視・ログ
- **Events**
  - User events: ログイン成功・失敗、ログアウト、トークン更新などの記録
  - Admin events: 管理操作(ユーザー作成・設定変更)の記録
  - Realm settings → Events で有効化。保存期間も設定可
- **Metrics**: `KC_METRICS_ENABLED=true` で `/metrics`(Prometheus 形式)
- **Health**: `KC_HEALTH_ENABLED=true` で `/health`(稼働確認。k8s の probe 用)
### 構成・高可用
- **外部 DB**(PostgreSQL 推奨): 本番では内蔵 DB を使わない
- **Infinispan**: Keycloak が使う分散キャッシュ。複数台でセッションを共有する
- **Keycloak Operator**: Kubernetes にデプロイ・管理するための公式 Operator
- リバースプロキシ配下では `KC_PROXY_HEADERS=xforwarded` 等でヘッダを信頼させる
### 設定方法の優先順位
- コマンドライン引数 > 環境変数(`KC_...`) > `conf/keycloak.conf`
- `kc.sh build` で変わる設定(DB 種類など)と、起動時に変えられる設定(ホスト名など)がある
### テーマ・拡張
- **Theme**: ログイン画面・アカウント画面・管理画面・メールの見た目を差し替える
  - FreeMarker テンプレート + CSS。React で作るなら Keycloakify
- **SPI (Service Provider Interface)**: Java で機能を追加する拡張口
  - 例: Authenticator(独自の認証手順), Event Listener(イベントを外部へ通知), Protocol Mapper(独自 claim), User Storage(独自ユーザー保管先)
  - JAR を `providers/` に置いて `kc.sh build`

## 13. Admin REST API
### Admin REST API とは
- **何か**: 管理画面でできる操作(ユーザー作成・クライアント設定など)を **HTTP API で自動化**するもの
- ベース URL: `http://localhost:8080/admin/realms/{realm}/...`
- 認証: 管理権限を持つユーザー/クライアントの **Access Token** を `Authorization: Bearer` で付ける
- 用途: ユーザー一括登録、環境構築の自動化、アプリからのユーザー管理
### トークンの取り方
- **管理者ユーザーで取る(試すとき)**: `admin-cli` クライアント + Password Grant
  ```bash
  TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
    -d client_id=admin-cli -d grant_type=password \
    -d username=admin -d password=admin | jq -r .access_token)
  ```
  - `admin-cli` = Keycloak に最初から入っている管理用 Public クライアント
  - 取得先は `master` realm(管理者が master にいるため)
- **本番**: 専用クライアント(Client auth ON + Service accounts)の Client Credentials を使う
  - Service account に `realm-management` の必要最小限のロールだけ付ける
### 必要なロール(`realm-management` クライアントのロール)
- `view-users` / `manage-users`: ユーザーの参照 / 作成・変更
- `view-clients` / `manage-clients`: クライアントの参照 / 作成・変更
- `view-realm` / `manage-realm`: realm 設定の参照 / 変更
- `query-users`, `query-groups`: 検索
- `realm-admin`: 全部(強すぎるので避ける)
### 主な API
- ユーザー検索: `GET /admin/realms/myrealm/users?username=taro`
- ユーザー作成: `POST /admin/realms/myrealm/users` (body: JSON)
  ```json
  { "username": "hanako", "email": "hanako@example.com", "enabled": true,
    "credentials": [{ "type": "password", "value": "pass1234", "temporary": false }] }
  ```
- クライアント検索: `GET /admin/realms/myrealm/clients?clientId=frontend-spa`
  - 返りの `id` が **Client UUID**(以降の API で使う)
- secret 取得: `GET /admin/realms/myrealm/clients/{uuid}/client-secret`
- ロール付与: `POST /admin/realms/myrealm/users/{userId}/role-mappings/realm`
- 例
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:8080/admin/realms/myrealm/users
  ```
### そのほかの自動化手段
- **kcadm.sh**: Keycloak 同梱の CLI。API を呼ぶラッパー
- **Terraform provider**: realm / client / role をコードで管理(宣言的)
- **Import / Export**: `kc.sh export --realm myrealm` で設定を JSON に書き出し、`kc.sh import` や `--import-realm` で復元
- **Account REST API**: ユーザー本人が自分の情報を操作する API(別物)

## 14. 手を動かす (ハンズオン)
### この章のゴール
- 第7章の Authorization Code Flow (PKCE) と Client Credentials Flow を、**自分の手で1ステップずつ**実行する
- 各ステップに「やること」「期待する結果」「うまくいかないとき」を書いている
- 前提: Docker、`curl`、`jq`、`openssl` が使えること(Mac は `brew install jq` で入る)
- 登場する名前(この章で作るもの)
  - realm: `myrealm`
  - ユーザー: `taro` / パスワード `pass1234`
  - Public client: `frontend-spa`(Client authentication OFF)
  - Confidential client: `backend-web`(ON)
  - API 用 client: `backend-api`(Client Role `read` を持つ)
  - バッチ用 client: `batch-job`(ON + Service accounts)
### Step 0. Keycloak を起動する
- やること
  ```bash
  docker run --rm --name kc -p 8080:8080 \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
    -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    quay.io/keycloak/keycloak:26.0 start-dev
  ```
- 期待する結果
  - ログに `Keycloak 26.x.x ... started` と出る(初回は1〜2分)
  - http://localhost:8080 を開くとログイン画面が出る → `admin` / `admin` で入る
- うまくいかないとき
  - ポート 8080 使用中 → `-p 8081:8080` に変えて、以降の URL も 8081 に読み替える
  - 旧バージョンは変数名が `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`
- 止めるとき: `docker stop kc`(`--rm` 付きなので**設定は消える**。学習用なのでOK)
### Step 1. Realm を作る
- やること
  1. 画面左上の「Keycloak」(現在の realm 名 `master`)のドロップダウンを開く
  2. 「Create realm」→ Realm name に `myrealm` → Create
- 期待する結果: 左上の表示が `myrealm` に変わる
- 確認(Discovery が返る)
  ```bash
  curl -s http://localhost:8080/realms/myrealm/.well-known/openid-configuration | jq '.issuer, .token_endpoint'
  ```
  - `"http://localhost:8080/realms/myrealm"` が表示されれば成功
  - これが後でトークンの `iss` になる値
### Step 2. ユーザー `taro` を作る
- やること
  1. 左メニュー Users → Add user
  2. Username=`taro`、Email=`taro@example.com`、First name=`Taro`、Last name=`Yamada` → Create
  3. 作成後の Credentials タブ → Set password
  4. Password / Password confirmation=`pass1234`、**Temporary を OFF** → Save
- 期待する結果: Credentials タブにパスワードが1件表示される
- うまくいかないとき
  - Temporary が ON のままだと、初回ログインでパスワード変更を求められ流れが止まる
  - email / 名前が空だと、ログイン時に `Account is not fully set up` と出ることがある
### Step 3. Public client `frontend-spa` を作る
- やること
  1. Clients → Create client
  2. General settings: Client type=`OpenID Connect`、Client ID=`frontend-spa` → Next
  3. Capability config
     - **Client authentication = OFF**
     - Authentication flow は **Standard flow だけ ON**(他は OFF) → Next
  4. Login settings
     - Valid redirect URIs=`http://localhost:3000/callback`
     - Web origins=`http://localhost:3000` → Save
- 期待する結果: Clients 一覧に `frontend-spa` が出る。Credentials タブは**表示されない**(= Public の証拠)
- ポイント: `http://localhost:3000` では何も動かさなくてよい(次のステップで理由を説明)
### Step 4. Authorization Code Flow を手動で実行する (PKCE あり)
- 目的: 第7-1 の手順 1〜8 を、アプリの代わりに自分でやる
- 4-1. PKCE の値を作る(ターミナル)
  ```bash
  CODE_VERIFIER=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-64)
  CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
  echo "verifier : $CODE_VERIFIER"
  echo "challenge: $CODE_CHALLENGE"
  ```
  - verifier = アプリだけが知る秘密の乱数 / challenge = そのハッシュ(これだけ Keycloak に先に渡す)
  - **同じターミナルを閉じない**(変数が消えると後で交換できない)
- 4-2. 認可 URL を作って表示する
  ```bash
  echo "http://localhost:8080/realms/myrealm/protocol/openid-connect/auth?client_id=frontend-spa&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid%20profile%20email&state=abc123&nonce=n-0S6_WzA2Mj&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"
  ```
  - 出力された URL を**ブラウザのアドレスバーに貼って開く**
- 4-3. ブラウザでログインする
  - Keycloak のログイン画面が出る → `taro` / `pass1234` を入力
  - ログインに成功するとブラウザが `http://localhost:3000/callback?...` に移動する
  - **ページは「接続できません」等のエラーになるが、これで正常**(そこに何も動いていないため)
  - 大事なのは**アドレスバーの URL**。次のような形になっている
    ```
    http://localhost:3000/callback?state=abc123&session_state=1b2c...&iss=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fmyrealm&code=7a3f9c1e-....-....
    ```
  - `state=abc123` が送った値と**一致**していることを確認(CSRF 対策の照合を手でやっている)
  - `code=` の値(`&` の手前まで)をコピーする
- 4-4. **60秒以内に** code を token に交換する(ターミナル)
  ```bash
  CODE='ここに code= の値を貼る'
  curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
    -d grant_type=authorization_code \
    -d client_id=frontend-spa \
    -d redirect_uri=http://localhost:3000/callback \
    -d code="$CODE" \
    -d code_verifier="$CODE_VERIFIER" | tee /tmp/tokens.json | jq 'keys'
  ```
  - code の寿命は約1分(Realm settings → Tokens → Access Code Lifespan)。遅いと失敗する
  - 期待する結果: `["access_token","expires_in","id_token","not-before-policy","refresh_expires_in","refresh_token","scope","session_state","token_type"]`
- うまくいかないとき
  - `invalid_grant` / "Code not valid" → code の期限切れ、または2回目の使用。**4-2 からやり直す**(code は使い捨て)
  - `invalid_grant` / "PKCE verification failed" → `CODE_VERIFIER` を別ターミナルで作り直した等で、challenge と合わない。4-1 からやり直す
  - `Invalid parameter: redirect_uri` → Step 3 の Valid redirect URIs と不一致
  - `Invalid client` → client_id のスペルミス
### Step 5. トークンの中身を読む
- Access Token を decode する
  ```bash
  jq -r .access_token /tmp/tokens.json | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null | jq .
  ```
  - JWT は `header.payload.signature`。2番目(payload)を Base64URL デコードしている
  - 末尾の `=` が足りず base64 がエラーになる場合は、https://jwt.io に貼るのが手軽(**学習用トークンのみ**)
- 見るポイント(第3章と対応させる)
  - `iss` = `http://localhost:8080/realms/myrealm`
  - `sub` = taro の UUID(Users 画面の ID と同じ)
  - `azp` = `frontend-spa`(要求者)
  - `aud` = `account`(まだ API 向けの設定をしていないため)
  - `exp - iat` = 300(5分)
  - `preferred_username` = `taro`
  - `scope` = `openid profile email`
- ID Token も同様に decode して、`aud` が `frontend-spa`、`nonce` が `n-0S6_WzA2Mj` になっているのを確認する
### Step 6. 管理画面の Evaluate でも確認する
- やること: Clients → `frontend-spa` → Client scopes タブ → **Evaluate** サブタブ
  1. Users に `taro` を入力して選択
  2. 「Generated access token」をクリック
- 期待する結果: Step 5 とほぼ同じ内容の JSON が表示される
- ポイント: **ログインせずに**、設定変更後のトークン内容を事前確認できる。以降の Mapper 実験で使う
### Step 7. Userinfo と Introspection を呼ぶ
- Userinfo(Access Token で自分の情報を取る)
  ```bash
  AT=$(jq -r .access_token /tmp/tokens.json)
  curl -s http://localhost:8080/realms/myrealm/protocol/openid-connect/userinfo -H "Authorization: Bearer $AT" | jq .
  ```
  - `sub`、`preferred_username`、`email` などが返る
- Introspection は呼び出し側の認証が必要なので、Step 8 の後に行う
### Step 8. Confidential client `backend-web` と `backend-api` を作る
- `backend-web`(ログインさせる側)
  1. Clients → Create client → Client ID=`backend-web`
  2. Capability config: **Client authentication = ON**、Standard flow ON
  3. Valid redirect URIs=`http://localhost:3000/callback` → Save
  4. Credentials タブで **Client secret** をコピー(以降 `SECRET` と呼ぶ)
- `backend-api`(トークンを受け取る側)
  1. Clients → Create client → Client ID=`backend-api`
  2. Capability config: **Client authentication = ON**、**フローはすべて OFF** → Save
     - introspection で使う secret を取るために ON にする
  3. Credentials タブで secret をコピー(`API_SECRET`)
  4. Roles タブ → Create role → Role name=`read` → Save
- 確認: Credentials タブがあるのは `backend-web` と `backend-api`(= ON)。`frontend-spa` には無い
- Introspection を呼ぶ(`backend-api` として、Step 4 の Access Token を検査)
  ```bash
  curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token/introspect \
    -u 'backend-api:API_SECRET' -d token="$AT" | jq '{active, sub, aud, azp, scope}'
  ```
  - `active: true` が返る
  - 5分(`expires_in`)後に同じ呼び出しをすると `{"active": false}` になる
### Step 9. Confidential client で Auth Code を実行して違いを見る
- Step 4 を `backend-web` で繰り返す(PKCE は省略してもよい)
  - 4-2 の URL の `client_id=frontend-spa` を `backend-web` に変え、`code_challenge` 関連の2つのパラメータを外す
  - 4-3 で code を取る
  - 4-4 の交換リクエストを次のように変える
    ```bash
    curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
      -u 'backend-web:SECRET' \
      -d grant_type=authorization_code \
      -d redirect_uri=http://localhost:3000/callback \
      -d code="$CODE" | jq 'keys'
    ```
- 体験すること
  - `-u 'backend-web:SECRET'` を外してみる → `unauthorized_client` / "Invalid client or Invalid client credentials"
  - `frontend-spa` では secret なしで通ったのに、`backend-web` は secret が必須 = **Client authentication の ON/OFF の違い**(第6章)
### Step 10. Client Credentials Flow を試す
- Client の用意
  1. Clients → Create client → Client ID=`batch-job`
  2. Capability config: **Client authentication = ON**、**Service accounts roles = ON**、Standard flow は OFF → Save
  3. Credentials タブで secret をコピー(`BATCH_SECRET`)
- 実行
  ```bash
  curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
    -u 'batch-job:BATCH_SECRET' -d grant_type=client_credentials | jq 'keys'
  ```
- 期待する結果: `access_token` はあるが **`refresh_token` と `id_token` は無い**
- decode して見るポイント
  - `preferred_username` = `service-account-batch-job`
  - `sub` = Users 画面の「service-account-batch-job」ユーザーの ID
  - `azp` = `batch-job`
- 比較実験: `frontend-spa`(Public)で同じことをする
  ```bash
  curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
    -d client_id=frontend-spa -d grant_type=client_credentials | jq .
  ```
  - `unauthorized_client` になる(Public は Client Credentials 不可)
### Step 11. Client Role を作って `aud` と `resource_access` の変化を見る
- やること
  1. Users → `taro` → Role mapping タブ → Assign role
  2. フィルタを「Filter by clients」にして、`backend-api` の `read` を選択 → Assign
  3. Step 4 を `frontend-spa` で再実行して新しい Access Token を取得
     - **古いトークンは変わらない**。必ず取り直す
- 期待する結果
  - `aud` に `backend-api` が増える(`roles` スコープの **Audience Resolve** が働いた)
  - `resource_access` に `"backend-api": {"roles": ["read"]}` が入る
- 確認は Step 6 の Evaluate でも可能(取り直し不要)
- 変化しないとき
  - `Full scope allowed` が OFF → Clients → `frontend-spa` → Client scopes → `frontend-spa-dedicated` → Scope タブで `read` を許可
### Step 12. Mapper を自分で作る
- 12-1. User Attribute Mapper
  1. Users → `taro` → Attributes タブ → Key=`department` Value=`sales` → Save
     - Attributes タブが無い場合: Realm settings → User profile で「Unmanaged attributes」を有効にする
  2. Clients → `frontend-spa` → Client scopes → `frontend-spa-dedicated` → Configure a new mapper → **User Attribute**
  3. Name=`dept`、User Attribute=`department`、Token Claim Name=`dept`、Claim JSON type=`String`、Add to access token=ON → Save
  4. Evaluate で Generated access token → `"dept": "sales"` が出れば成功
- 12-2. Audience Mapper (固定で aud を追加)
  1. 同じ dedicated scope に **Audience** Mapper を追加
  2. Included Client Audience=`backend-api`、Add to access token=ON → Save
  3. ロールを外しても `aud` に `backend-api` が残ることを Evaluate で確認
- 12-3. わざと OFF にして挙動を見る
  - `dept` Mapper の「Add to access token」を OFF → Evaluate で `dept` が消える
  - 「claim が出ない」ときの最初の確認項目(第15章)を体感する
### Step 13. Refresh Token でトークンを更新する
- やること
  ```bash
  RT=$(jq -r .refresh_token /tmp/tokens.json)
  curl -s -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
    -d grant_type=refresh_token -d client_id=frontend-spa -d refresh_token="$RT" | jq 'keys'
  ```
- 期待する結果: 新しい `access_token` と `refresh_token` が返る(`/tmp/tokens.json` を上書きしてもよい)
- 実験
  - Realm settings → Tokens →「Revoke Refresh Token」を ON にして保存 → もう一度 Step 4 でトークンを取り直す
  - 同じ `refresh_token` を**2回**使う → 2回目は `invalid_grant`(使い捨て = Rotation の効果)
### Step 14. Logout を試す
- ブラウザで次の URL を開く(`id_token_hint` に Step 4 の ID Token を入れる)
  ```bash
  IDT=$(jq -r .id_token /tmp/tokens.json)
  echo "http://localhost:8080/realms/myrealm/protocol/openid-connect/logout?id_token_hint=$IDT&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F"
  ```
  - `post_logout_redirect_uri` を使うには、`frontend-spa` の Valid post logout redirect URIs に `http://localhost:3000/` を登録しておく
- 確認
  - もう一度 Step 4-2 の URL を開くとログイン画面が再び出る(SSO セッションが終わっている)
  - 古い Refresh Token で更新すると `invalid_grant` ("Session not active")
### Step 15. API を作ってトークンを検証する (発展)
- 最小の FastAPI 例(PyJWT)
  ```python
  # pip install fastapi uvicorn "pyjwt[crypto]"
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
      return {"user": claims["preferred_username"], "items": [1, 2, 3]}
  ```
- 起動と呼び出し
  ```bash
  uvicorn app:app --port 9000
  curl -i localhost:9000/items -H "Authorization: Bearer $AT"
  ```
- 体験すること(第8章のチェックリストを実際に壊す)
  - Step 11 の前のトークン → `aud` が合わず 401
  - ロール `read` を外したトークン → 403
  - トークンの末尾1文字を変える → 署名エラーで 401
  - 5分以上経ったトークン → `Signature has expired` で 401
### 管理画面の便利機能 (困ったとき)
- Clients → Client scopes → **Evaluate**: 実際に発行されるトークンの内容を確認
- Sessions(左メニュー): 現在ログイン中のセッション一覧。**Sign out** で強制終了
- Events: Realm settings → Events → Save events を ON にすると、ログイン失敗の理由(`invalid_redirect_uri` など)が見える
- Realm settings → Action → **Partial export**: 設定を JSON で書き出す

## 15. トラブルシューティング
### エラー早見表
- `Invalid parameter: redirect_uri`
  - Valid redirect URIs 不一致 (末尾スラッシュ・ポート・http/https)
- `invalid_client` / `unauthorized_client`
  - Client auth ON なのに secret 不備 / 無効なフロー (例: OFF で client_credentials)
- `invalid_grant` + "Code not valid"
  - code の使い回し・期限切れ(約1分)・redirect_uri 不一致
- `invalid_grant` + "PKCE verification failed"
  - code_verifier が challenge と合わない
- `invalid_grant` + "Session not active"
  - SSO セッション期限切れ → 再ログイン
- `invalid_scope`
  - 存在しない/割り当てていない Client Scope を要求
- `Account is not fully set up`
  - Required action 残存 / email, firstName, lastName 必須設定
- `Resource not found` (404)
  - realm 名のミス、旧 `/auth` パス
- CORS エラー
  - Web origins 未設定
- `HTTPS required`
  - 外部アクセスで SSL Required = external → `none` は開発のみ
### API 側で 401
- `iss` 不一致 (Docker 内 `keycloak:8080` vs ブラウザ `localhost:8080`)
  - → `KC_HOSTNAME` / Frontend URL を統一
- `aud` に自分がいない → Audience Mapper / Client Role 付与
- `exp` 切れ / サーバー時刻ずれ
- 署名検証失敗 → 鍵ローテーション後に JWKS キャッシュが古い
### claim が出ない
- Mapper の「Add to access token」が OFF
- Client Scope が Client に未割り当て (Default/Optional)
- Optional なのに `scope=` に書いていない
- Full Scope Allowed OFF でロールが絞られている
- User Attribute 名のスペルミス / 値が未設定
- Lightweight Access Token が有効で claim が省略されている

## 16. 用語集
### 認証・認可の基本
- **認証 (Authentication)**: 「あなたは誰?」を確認すること(ログイン)
- **認可 (Authorization)**: 「あなたは何をしてよい?」を判断すること
- **IdP (Identity Provider)**: 認証を担当する側。Keycloak がこれ
- **SP / RP (Service Provider / Relying Party)**: ログインを IdP に任せる側。つまりアプリ
- **SSO (Single Sign-On)**: 一度ログインすれば複数アプリで再ログイン不要になる仕組み
- **MFA (多要素認証)**: パスワード + スマホのコードなど、複数の要素で確認
### OAuth / OIDC
- **OAuth 2.0**: 認可の標準。「アプリに、ユーザーの代わりにAPIを使う権限を渡す」仕組み
- **OIDC (OpenID Connect)**: OAuth 2.0 に「ユーザーが誰か」を伝える仕組み(ID Token)を足したもの
- **Grant Type**: トークンの取り方の種類(authorization_code, client_credentials, refresh_token ...)
- **Scope**: 「どの範囲の情報/操作を許可してほしいか」の要求(スペース区切りの文字列)
- **Claim**: トークンに入っている1つの情報(名前と値)
- **Redirect URI**: ログイン後にブラウザを戻す先の URL
- **State**: CSRF 対策。リクエスト時に送った値が戻ってきたか照合する
- **Nonce**: ID Token の使い回し(リプレイ)防止用のランダム値
- **PKCE (ピクシー)**: Authorization Code の横取り対策。`code_verifier` と `code_challenge` を使う
- **Bearer Token**: 「持っている人が使える」トークン。盗まれると悪用される
- **Confidential / Public Client**: secret を安全に持てる / 持てないクライアント
- **BFF (Backend For Frontend)**: SPA の代わりにサーバー側がトークンを扱う構成
### トークン関連
- **JWT (JSON Web Token)**: `header.payload.signature` 形式の署名付きトークン
- **JWS / JWE**: JWT の署名版 / 暗号化版
- **JWKS (JSON Web Key Set)**: 署名検証用の公開鍵一覧(JSON)
- **kid (Key ID)**: どの鍵で署名したかを示す ID
- **Introspection**: トークンが有効かサーバーに問い合わせること
- **Revocation**: トークンを失効させること
- **Offline Token**: ユーザー不在でも長期間使える Refresh Token
- **Sender-constrained Token**: DPoP や mTLS で「持ち主」に紐づけ、盗用されても使えなくしたトークン
- **ACR (Authentication Context Class Reference)**: 認証の強さのレベル
- **AMR (Authentication Methods References)**: 使われた認証方法(`pwd`, `otp` など)
### Keycloak 固有
- **Realm**: ユーザーや設定を隔離する管理単位
- **Client**: Keycloak に登録するアプリ/API
- **Client Scope**: トークンに載せる情報のセット
- **Protocol Mapper**: claim を作る部品
- **Realm Role / Client Role / Composite Role**: realm 共通 / クライアント専用 / 束ねたロール
- **Service Account**: Client Credentials 用の自動作成ユーザー
- **Required Action**: 次回ログイン時に必ずやらせる作業
- **Authentication Flow**: ログイン手順の定義
- **Identity Brokering**: 外部 IdP にログインを任せて、結果を Keycloak 経由で受け取る
- **User Federation**: LDAP/AD など既存の名簿を Keycloak につなぐ
- **SPI**: Java で Keycloak を拡張する仕組み
- **Infinispan**: Keycloak 内蔵の分散キャッシュ
### 規格
- **OAuth 2.1**: Implicit と Password Grant を廃止し PKCE を必須化した OAuth 2.0 の整理版(策定中)
- **SAML 2.0**: XML ベースの SSO 規格。企業システムで現役
- **LDAP**: ディレクトリ(ユーザー名簿)へのアクセス規格

## 17. 学習リソース
- 公式ドキュメント: https://www.keycloak.org/documentation
- Server Admin Guide / Securing Apps
- RFC
  - RFC 6749 (OAuth 2.0)
  - RFC 7636 (PKCE)
  - RFC 7519 (JWT)
  - RFC 8693 (Token Exchange)
  - RFC 8628 (Device Grant)
  - RFC 7662 (Introspection)
  - OpenID Connect Core 1.0
- 見るべき JSON: `/.well-known/openid-configuration`
- ツール: jwt.io, Postman, `curl` + `jq`, oidcdebugger.com
