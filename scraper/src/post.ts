import FB from 'fb';
import { headerIdx, Rows } from './type';

export async function post(newDocs: Rows) {
    const fbToken = process.env.FB_TOKEN;
    if (!fbToken || fbToken === "") {
        console.log("env `FB_TOKEN` is empty, skip posting Facebook");
        return;
    }
    FB.setAccessToken(fbToken);

    let message = `ราชกิจจามาใหม่แล้วจ้า!!\n\n`;
    newDocs.forEach((newDoc) => {
        message += `${newDoc[headerIdx.date]} ${newDoc[headerIdx.title]} ${newDoc[headerIdx.url]}\n\n`;
    })
    message + `#ราชกิจจานุเบกษา #ratchakitcha`

    FB.api('ratchagitja/feed', 'post', {
        batch: [
            { method: 'post', relative_url: 'ratchagitja/feed', body: 'message=' + encodeURIComponent(message) }
        ]
    }, function (res) {
        if (!res || res.error) {
            console.error(!res ? 'error occurred' : res.error);
            return;
        }

        const jsonResp = JSON.parse(res[0].body);

        if (jsonResp.error) {
            console.error(jsonResp.error);
            return;
        } else {
            console.log('posted to Facebook id: ' + jsonResp.id);
        }
    });
}
