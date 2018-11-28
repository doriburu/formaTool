select
  ap.application_id
  , ap.application_name
  , fr.form_id
  , fr.form_name 
from
  imfr_m_application ap 
  inner join imfr_m_form_relation fr_re 
    on ap.application_id = fr_re.application_id
    and ap.locale_id = 'ja' 
  inner join imfr_m_form fr 
    on fr_re.form_id = fr.form_id 
    and fr.locale_id = 'ja' 
where
  fr.form_id = /*form_id:string*/''
