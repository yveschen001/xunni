export default {
  "alreadyExists": "⏳ 保留中の申請があります (ID: #{appealId})\n\nステータス: {status}\n提出時間: {time}\n\n管理者のレビューをお待ちください。",
  "approved": "✅ あなたの苦情は承認されました。アカウントが解除されました。",
  "noAppeal": "現在、保留中の苦情はありません",
  "notBanned": "✅ あなたのアカウントは禁止されておらず、異議申し立ての必要はありません。",
  "notFound": "❌ あなたの異議申し立て記録が見つかりません。",
  "notes": "備考：",
  "prompt": "📝 **異議申し立ての提出**\n\nあなたのアカウントが禁止された理由と、この問題をどのように解決したいかを説明してください。\n\n💡 管理者があなたの異議申し立てを迅速に処理できるように、状況についての詳細情報を提供してください。",
  "reasonTooLong": "❌ 異議申し立ての理由が長すぎます。500文字以内に収めてください。",
  "reasonTooShort": "❌ 異議申し立ての理由が短すぎます。最低でも10文字を入力してください。",
  "rejected": "❌ あなたの苦情は却下されました。",
  "reviewedAt": "審査時間：",
  "status": "📋 **異議申し立てのステータス**\n\n異議申し立てID: #{appealId}\nステータス: {status}\n提出時間: {createdAt}{reviewInfo}",
  "statusApproved": "承認",
  "statusPending": "審査中",
  "statusRejected": "却下",
  "submitted": "✅ **異議申し立てが提出されました**\n\n異議申し立てID: #{appealId}\nステータス: 審査中\n\n1-3営業日以内にあなたの異議申し立てを処理します。\n結果はBotを通じて通知されます。"
};
