import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import inquirer from "inquirer";
import { setTimeout } from "node:timers/promises";
import "dotenv/config";

const tracks = [];
const youtubeLinks = [];

const startScript = async () => {
    await getPlaylistSongs();
    await getYoutubeLinks();
};

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

    console.log("Login successful!");

    await setTimeout(5000);

    const content = await page.content();
    const $ = cheerio.load(content);

    const $yourLibraryList = $(
        'ul[aria-label="Your Library"] > div:first > div:eq(1) > li'
    );

    const playlists = [];

    $yourLibraryList.each((index, element) => {
        const playlist = $(element).find("p:first").text();
        playlists.push(playlist);
    });

    const answer = await inquirer.prompt([
        {
            type: "list",
            name: "playlist",
            message: "Select playlist:",
            choices: playlists,
        },
    ]);

    const selectedPlaylistIndex = playlists.findIndex(
        (playlist) => playlist === answer.playlist
    );

    await page
        .locator(
            `[aria-label="Your Library"] > div > div:nth-child(2) > li:nth-child(${
                selectedPlaylistIndex + 1
            }) > div > [role="button"]`
        )
        .click();

    await page.locator('div[data-testid="playlist-tracklist"]').click();
    await page.keyboard.press("End");
    await setTimeout(2000);

    console.log(`Fetching tracks from the playlist...`);

    await setTimeout(2000);

    const updatedContent = await page.content();
    const updated$ = cheerio.load(updatedContent);

    const $tracklist = updated$(
        'div[data-testid="playlist-tracklist"] > div:nth-child(2) > div:nth-child(2) > [role="row"]'
    );

    $tracklist.each((index, element) => {
        const track = $(element).find("a:first").text();
        const artist = $(element).find("a:eq(1)").text();
        tracks.push(`${track} - ${artist} audio`);
    });

    console.log(tracks);

    await browser.close();
};

const getYoutubeLinks = async () => {
    // if (tracks.length === 0) {
    //     console.log("Empty tracklist.");
    //     return;
    // }

    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    await page.goto("https://www.youtube.com/");
    await page.setViewport({ width: 1440, height: 1024 });

    await page.waitForSelector("#search");

    for (const element of tracks) {
        await page.locator("input#search").fill(element);
        await page.locator("button#search-icon-legacy").click();
        await setTimeout(2000);
        await page.waitForSelector(
            "div#contents ytd-video-renderer ytd-thumbnail > a#thumbnail"
        );

        const content = await page.content();
        const $ = cheerio.load(content);

        const link = $(
            `div#contents ytd-video-renderer ytd-thumbnail > a#thumbnail`
        ).attr("href");

        console.log(`https://www.youtube.com/${link}`);

        youtubeLinks.push(`https://www.youtube.com/${link}`);
    }

    console.log(youtubeLinks);
};

startScript();
