import zustandStorage from '@/storage/storage';
import supabase from '@/storage/supabase';

async function uploadEvidence(
  uri: string,
  filename: string,
  date: number,
  id: string
) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const evidence = await new Response(blob).arrayBuffer();

  console.log('Uploading evidence:', filename);

  const { data, error } = await supabase.storage
    .from('evidences')
    .upload(`/${id}/${filename}`, evidence, {
      contentType: 'video/mov',
      cacheControl: '604800',
      upsert: false
    });

  if (error) {
    console.error(error);
    return;
  }

  console.log('Upload complete:', filename);

  const path = data.path;

  const { data: urlData, error: urlError } = await supabase.storage
    .from('evidences')
    .createSignedUrl(path, 2592000);

  if (urlError) {
    console.error(urlError);
    return;
  }

  const evidenceObject = {
    name: filename,
    uri: urlData.signedUrl,
    date: date
  };

  let evidenceUrlArray =
    // @ts-expect-error ERROR: MMKV type error
    JSON.parse(zustandStorage.getItem('evidenceObjects'));

  const newArr = [...evidenceUrlArray, evidenceObject];

  zustandStorage.setItem('evidenceObjects', JSON.stringify(newArr));
}

export default uploadEvidence;
