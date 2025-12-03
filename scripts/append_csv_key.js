
const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
const newLine = `career.next_step_industry,career,接下來請選擇您的行業類別：,接下来请选择您的行业类别：,"Next, please select your industry:",次に、業界を選択してください：,다음으로 업종을 선택해 주세요.,"Tiếp theo, vui lòng chọn ngành nghề của bạn.",ถัดไป โปรดเลือกอุตสาหกรรมของคุณ,"Selanjutnya, silakan pilih industri Anda.","Seterusnya, sila pilih industri anda.","Susunod, mangyaring piliin ang iyong industriya.","इसके बाद, कृपया अपना उद्योग चुनें।",بعد ذلك، يرجى اختيار مجال عملك.,اس کے بعد، براہ کرم اپنی صنعت کا انتخاب کریں۔,در مرحله بعد، لطفا صنعت خود را انتخاب کنید.,"לאחר מכן, אנא בחר את הענף שלך.",Sırada, lütfen sektörünüzü seçin.,"Далее, пожалуйста, выберите вашу отрасль.","Далі, будь ласка, виберіть вашу галузь.","Następnie proszę wybrać branżę.","Dále prosím vyberte své odvětví.","În continuare, te rugăm să selectezi industria ta.","Következő lépésként kérjük, válassza ki iparágát.","পরবর্তীতে, অনুগ্রহ করে আপনার শিল্প নির্বাচন করুন।","Zatim odaberite svoju industriju.","Ďalej prosím vyberte svoje odvetvie.","Nato izberite svojo panogo.","Zatim odaberite svoju industriju.","Следно, ве молиме изберете ја вашата индустрија.","Tjetër, ju lutemi zgjidhni industrinë tuaj.","Στη συνέχεια, επιλέξτε τον κλάδο σας.","Wählen Sie als Nächstes Ihre Branche aus.","Ensuite, veuillez sélectionner votre secteur d'activité.","A continuación, seleccione su industria.","Successivamente, seleziona il tuo settore.","Em seguida, selecione sua indústria.","Selecteer vervolgens uw branche.","Välj sedan din bransch.","Deretter velger du bransjen din.","Wählen Sie als Nächstes Ihre Branche aus.","Valitse seuraavaksi toimialasi."`;

fs.appendFileSync(csvPath, '\n' + newLine);
console.log('Appended new key to CSV');

