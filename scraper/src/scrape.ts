import puppeteer from 'puppeteer';


const ratchakitchaHome = 'https://ratchakitcha.soc.go.th';

export async function scrape(excelDirPath: string) {
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: true,
        devtools: false,
    });

    // get current page
    const page = (await browser.pages())[0];

    // set download behavior
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: excelDirPath });

    await page.goto(ratchakitchaHome, { waitUntil: 'networkidle2' });

    // get monthly selector
    await page.evaluate(async () => {
        const downloadButton = document.getElementsByClassName('btn-monthly-report').item(0) as HTMLButtonElement;
        const monthlySelector = document.getElementById('monthlyreport_month') as HTMLSelectElement;
        const monthlyOptions = monthlySelector.getElementsByTagName('option');

        for (let i = 0; i < monthlyOptions.length; i++) {
            const option = monthlyOptions[i]

            monthlySelector.value = option.value
            monthlySelector.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 1000));

            downloadButton.click();
            // TODO: listen download finished instead of delay
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    });

    await browser.close();
}
