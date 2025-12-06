/**
 * Intent Recognition Keywords
 * 
 * Defines keywords for various user intents across 40 supported languages.
 * Generated from i18n_for_translation.csv and manual entries.
 */

export const INTENT_KEYWORDS: Record<string, Record<string, string[]>> = {
  THROW_BOTTLE: {
    // zh-TW
    'zh-TW': ["丟","瓶子","漂流瓶","祝福","許願","扔","幸運","祈福","送出祝福漂流瓶","丟祝福漂流瓶"],
    // zh-CN
    'zh-CN': ["丢","瓶子","漂流瓶","祝福","许愿","扔","幸运","祈福","发送祝福漂流瓶"],
    // en
    'en': ["throw","bottle","drift","blessing","wish","lucky","send"],
    // ja
    'ja': ["投げる","ボトル","漂流瓶","祈り","願い","祝福","ラッキー","幸運","祈りのボトルを送信"],
    // ko
    'ko': ["던지기","병","표류병","축복","기도","행운","소원","축복의","보내기"],
    // vi
    'vi': ["gửi","một","chai","cầu","nguyện","chúc","phúc"],
    // th
    'th': ["ส่งขวดอวยพรพร้อมคำอวยพร"],
    // id
    'id': ["kirim","botol","berkah","dengan"],
    // ms
    'ms': ["hantar","botol","restu","dengan","berkat"],
    // tl
    'tl': ["magpadala","ng","bote","pagpapala","na","may","mga","pagbati"],
    // hi
    'hi': ["संदेश","की","बोतल","भेजें","जिसमें","आशीर्वाद","हो"],
    // ar
    'ar': ["أرسل","زجاجة","البركة","مع","بركات"],
    // ur
    'ur': ["دعاؤں","کے","ساتھ","ایک","پیغام","کی","بوتل","بھیجیں"],
    // fa
    'fa': ["یک","پیام","با","برکات","فرستادن"],
    // he
    'he': ["שלח","בקבוק","הודעות","עם","ברכות"],
    // tr
    'tr': ["bereketlerle","bir","dilek","şişesi","gönder"],
    // ru
    'ru': ["отправьте","бутылку","сообщением","благословениями"],
    // uk
    'uk': ["відправити","повідомлення","пляшці","побажаннями"],
    // pl
    'pl': ["wyślij","wiadomość","butelce","błogosławieństwami"],
    // cs
    'cs': ["odešli","zprávu","lahvi","požehnáním"],
    // ro
    'ro': ["trimite","sticlă","cu","mesaje","binecuvântări"],
    // hu
    'hu': ["küldj","egy","üzenetpalackot","áldásokkal"],
    // bn
    'bn': ["আশীর্বাদ","সহ","একটি","বার্তা","বোতল","প্রেরণ","করুন"],
    // hr
    'hr': ["pošaljite","poruku","boci","blagoslovima"],
    // sk
    'sk': ["pošlite","správu","fľaši","požehnaniami"],
    // sl
    'sl': ["pošlji","sporočilno","steklenico","blagoslovi"],
    // sr
    'sr': ["pošaljite","poruku","boci","sa","blagoslovima"],
    // mk
    'mk': ["испрати","порака","во","шише","со","благослови"],
    // sq
    'sq': ["dërgo","një","mesazh","të","bekuar","nëpërmjet","shishes","së","mesazheve"],
    // el
    'el': ["στείλε","ένα","μήνυμα","ευλογίας","με","το","μπουκάλι"],
    // de
    'de': ["sende","eine","segensnachricht","über","die","segensflasche"],
    // fr
    'fr': ["envoyer","une","bouteille","de","vœux","bénédiction"],
    // es
    'es': ["enviar","una","botella","de","bendición"],
    // it
    'it': ["invia","una","bottiglia","dei","desideri","di","benedizione"],
    // pt
    'pt': ["enviar","uma","garrafa","de","bênção"],
    // nl
    'nl': ["stuur","een","zegen","boodschapfles"],
    // sv
    'sv': ["skicka","ett","välsignelse","meddelandebehållare"],
    // no
    'no': ["send","blessing","bottle"],
    // da
    'da': ["send","blessing","bottle"],
    // fi
    'fi': ["lähetä","siunaus","viestipullo"],
    // General fallback
    'general': ['throw', 'bottle', 'drift', 'blessing']
  },
  
  CATCH_BOTTLE: {
    // zh-TW
    'zh-TW': ["撿","撈","看","收","撿起祝福漂流瓶"],
    // zh-CN
    'zh-CN': ["捡","捞","看","收","捡起祝福漂流瓶"],
    // en
    'en': ["catch","pick","get","picked","up","blessing","bottle"],
    // ja
    'ja': ["拾う","キャッチ","受け取る","読む","祈りのメッセージボトルを拾う"],
    // ko
    'ko': ["줍기","받기","읽기","축복의","병을","주웠습니다"],
    // vi
    'vi': ["đã","nhặt","được","một","chai","cầu","nguyện","chứa","thông","điệp","may","mắn"],
    // th
    'th': ["เก็บขวดอวยพรของพรไว้เรียบร้อยแล้ว"],
    // id
    'id': ["mengambil","botol","berkah"],
    // ms
    'ms': ["mengambil","botol","restu","berkat"],
    // tl
    'tl': ["nakakuha","ng","bote","pagpapala"],
    // hi
    'hi': ["आशीर्वाद","संदेश","बोतल","उठाई"],
    // ar
    'ar': ["قمت","بالتقاط","زجاجة","البركة","تحمل","بركة"],
    // ur
    'ur': ["ایک","خوشی","کا","پیغام","بوتل","ملا"],
    // fa
    'fa': ["پیامی","از","یک","بطری","پیام","آورده","شد"],
    // he
    'he': ["אספת","בקבוק","הודעות","ברכה"],
    // tr
    'tr': ["bir","nimet","dilek","şişesi","alındı"],
    // ru
    'ru': ["подобрали","бутылку","сообщением","благословении"],
    // uk
    'uk': ["взято","повідомлення","пляшки","благословення"],
    // pl
    'pl': ["podniesiono","butelkę","błogosławieństwem"],
    // cs
    'cs': ["vzal","jsem","požehnání","zaručenou","zprávu","láhve"],
    // ro
    'ro': ["ați","ridicat","sticlă","de","mesaj","cu","binecuvântare"],
    // hu
    'hu': ["felvett","egy","áldást","tartalmazó","üzenetpalackot"],
    // bn
    'bn': ["আশীর্বাদ","বার্তা","বোতল","উদ্ধার","করা","হয়েছে"],
    // hr
    'hr': ["podigao","sam","poruku","blagoslovom","iz","boce"],
    // sk
    'sk': ["zdvihol","som","požehnanú","správu","fľaše"],
    // sl
    'sl': ["prevzel","sem","sporočilno","steklenico","blagoslovom"],
    // sr
    'sr': ["pokupljena","poruka","od","blagoslova","blessing","bottle"],
    // mk
    'mk': ["подигнав","благословена","порака","во","шише"],
    // sq
    'sq': ["keni","një","mesazh","bekimi","nga","shishe","mesazhesh"],
    // el
    'el': ["σηκώσατε","ένα","ευχέλαιο","μήνυμα","μπουκάλι"],
    // de
    'de': ["eine","segensnachricht","in","einer","flasche","erhalten"],
    // fr
    'fr': ["bouteille","de","vœux","bénédiction","récupérée"],
    // es
    'es': ["recogió","una","botella","de","bendición"],
    // it
    'it': ["hai","raccolto","una","bottiglia","dei","desideri","di","benedizione"],
    // pt
    'pt': ["pegou","uma","garrafa","de","bênção"],
    // nl
    'nl': ["een","zegen","boodschap","fles","opgepikt"],
    // sv
    'sv': ["plockade","upp","en","välsignelse","meddelandeflaske"],
    // no
    'no': ["plukket","opp","en","velsignelse","fra","meldingflaske"],
    // da
    'da': ["opsamlet","en","velsignelse","fra","blessing","bottle"],
    // fi
    'fi': ["noudettu","siunaus","viesti","pullo"],
    // General fallback
    'general': ['catch', 'pick', 'get']
  }
};

/**
 * Check if text matches any keywords for a specific intent
 */
export function matchIntent(text: string, intent: keyof typeof INTENT_KEYWORDS): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const keywordsMap = INTENT_KEYWORDS[intent];
  
  // 1. Check all specific language keywords
  // We prioritize iterating all because we don't know the user's input language for sure here
  // (User might type English even if setting is Chinese)
  for (const lang in keywordsMap) {
    const keywords = keywordsMap[lang];
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return true;
    }
  }
  
  return false;
}
