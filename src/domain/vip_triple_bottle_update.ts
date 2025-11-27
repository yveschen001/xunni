
// 計算匹配亮點 (Highlights)
const highlights: string[] = [];
// 這裡使用簡單的邏輯，實際應該複用 matching.ts 的邏輯
if (bottleOwner.mbti_result && matcher.mbti_result) {
  // 假設只要有 MBTI 就顯示契合（簡化版，或者檢查是否在最佳匹配列表中）
  const { getBestMatches } = await import('~/domain/matching');
  const bestMatches = getBestMatches(matcher.mbti_result);
  if (bestMatches.includes(bottleOwner.mbti_result)) {
    highlights.push(i18n?.t('common.mbtiMatch') || '🧠 MBTI 契合');
  }
}
if (bottleOwner.zodiac_sign && matcher.zodiac_sign) {
  // 簡單假設
  highlights.push(i18n?.t('common.zodiacMatch') || '⭐ 星座契合');
}
// 如果沒有任何匹配點，顯示默認
if (highlights.length === 0) {
  highlights.push(i18n?.t('common.fateMatch') || '❤️ 緣分匹配');
}
const highlightsText = highlights.join('\n');

// 準備参数
const notSet = i18n?.t('common.notSet') || '未設定';
const ownerMbti = bottleOwner.mbti_result || notSet;
const ownerZodiac = bottleOwner.zodiac_sign || notSet;
  
// 並行發送兩個通知
await Promise.allSettled([
  // 通知瓶子主人
  telegram
    .sendMessage(
      parseInt(bottleOwner.telegram_id),
      (i18n?.t('vipTripleBottle.matchSuccess') || '🎯 **VIP 智能配對成功！**\n\n') +
          (i18n?.t('vipTripleBottle.bottlePicked', { maskedMatcherNickname }) || `你的瓶子已被 ${maskedMatcherNickname} 撿起！\n\n`) +
          // 也可以給 owner 顯示對方的 MBTI/星座
          (i18n?.t('vipTripleBottle.conversationIdentifier', { conversationIdentifier }) || `💬 對話標識符：${conversationIdentifier}\n`) +
          (i18n?.t('vipTripleBottle.bottleContent', { content: bottleContentPreview }) || `📝 瓶子內容：${bottleContentPreview}\n\n`) +
          (i18n?.t('vipTripleBottle.firstMatch') || `💡 這是你的第 1 個配對，還有 2 個槽位等待中\n\n`) +
          (i18n?.t('vipTripleBottle.viewChats') || `使用 /chats 查看所有對話\n\n`) +
          (i18n?.t('vipTripleBottle.replyHint') || `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`)
    )
    .catch((error) => {
      console.error('[VipTripleBottle] Failed to notify bottle owner:', error);
    }),

  // 通知撿瓶子的人
  telegram
    .sendMessage(
      parseInt(matcher.telegram_id),
      (i18n?.t('vipTripleBottle.smartMatch') || '🎉 **智能配對成功！**\n\n') +
          (i18n?.t('vipTripleBottle.foundBottle', { maskedOwnerNickname }) || `系統為你找到了 ${maskedOwnerNickname} 的瓶子！\n\n`) +
          (i18n?.t('vipTripleBottle.settings', { mbti: ownerMbti }) || `🧠 MBTI：${ownerMbti}\n`) +
          (i18n?.t('vipTripleBottle.settings2', { zodiac: ownerZodiac }) || `⭐ 星座：${ownerZodiac}\n`) +
          (i18n?.t('vipTripleBottle.bottle', { highlights: highlightsText }) || `\n💡 這個瓶子和你非常合拍！\n${highlightsText}\n\n`) +
          (i18n?.t('vipTripleBottle.conversationIdentifier', { conversationIdentifier }) || `💬 對話標識符：${conversationIdentifier}\n`) +
          (i18n?.t('vipTripleBottle.bottleContent', { content: bottle.content }) || `📝 瓶子內容：${bottle.content}\n\n`) +
          (i18n?.t('vipTripleBottle.replyHint') || `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`)
    )
    .catch((error) => {
      console.error('[VipTripleBottle] Failed to notify matcher:', error);
    }),
]);

