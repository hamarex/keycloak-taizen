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
