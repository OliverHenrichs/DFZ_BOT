import {Message} from "discord.js";
import {getGuildIdFromMessage, reactPositive} from "../../misc/messageHelper";
import {DFZDataBaseClient} from "../database/DFZDataBaseClient";
import {EmbeddingCreator} from "../discord/EmbeddingCreator";
import {IFieldElement} from "../discord/interfaces/IFieldElement";
import {HighscoreUserTypes} from "./enums/HighscoreUserTypes";
import {IHighScoreProviderSettings} from "./interfaces/HighscoreProviderSettings";

export abstract class AbstractHighScoreProvider<T> {
    protected dbClient: DFZDataBaseClient;
    protected resultTable: IFieldElement[];
    protected userType: HighscoreUserTypes;

    protected constructor(settings: IHighScoreProviderSettings) {
        this.dbClient = settings.dbClient;
        this.resultTable = JSON.parse(JSON.stringify(settings.tableTemplate)); // deep copy...
        this.userType = settings.userType;
    }

    public async postHighScore(message: Message) {
        const gid = getGuildIdFromMessage(message);
        const users = await this.getUsersFromDatabase(gid);
        await this.fillTableAndSendHighScores(users, message);
    }

    public generateHighScore(users: T[]) {
        this.fillHighscoreTable(users);
        return this.resultTable;
    }

    protected abstract getUsersFromDatabase(guildId: string): Promise<T[]>;

    protected abstract rowAdder(user: T): void;

    private async fillTableAndSendHighScores(users: T[], message: Message) {
        this.fillHighscoreTable(users);
        await this.sendHighScoreTable(message);
    }

    private fillHighscoreTable(users: Array<T>) {
        const maxNum = 10;
        for (let i = 0; i < Math.min(maxNum, users.length); i++)
            this.rowAdder(users[i]);
    }

    private async sendHighScoreTable(message: Message) {
        await reactPositive({message, deleteMessage: false, reply: ""});
        const embed = EmbeddingCreator.create(
            `Lobby Highscores (${this.userType}) Top 10`,
            `Hall of Fame of DFZ ${this.userType}!`,
            "",
            this.resultTable
        );
        await message.author.send({embeds: [embed]});
    }
}
