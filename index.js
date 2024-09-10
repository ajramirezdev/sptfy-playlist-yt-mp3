import puppeteer from "puppeteer";
import inquirer from "inquirer";
import "dotenv/config";

const getPlaylistSongs = async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    await page.goto("https://open.spotify.com/");
    await page.setViewport({ width: 1440, height: 1024 });

    await page.locator('[data-testid="login-button"]').click();

    console.log("Logging in...");

    await page.waitForNavigation();

    await page.locator('[id="login-username"]').fill(process.env.SPTFY_EMAIL);
    await page
        .locator('[id="login-password"]')
        .fill(process.env.SPTFY_PASSWORD);

    await page.locator('[id="login-button"]').click();

    await page.waitForNavigation();

    console.log("Login successful!");

    // const answer = await inquirer.prompt([
    //     {
    //         type: "list",
    //         name: "playlist",
    //         message: "Select playlist:",
    //         choices: [""],
    //     },
    // ]);
};

getPlaylistSongs();
