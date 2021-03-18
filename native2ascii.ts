import { parse } from 'https://deno.land/std/flags/mod.ts';

interface Comments {
    startsWith: string[]; // コメント開始文字列
    endsWith: string[]; // コメント終了文字列
}

interface CommentType {
    ML: Comments; // マルチラインコメント
    SL: Comments; // シングルラインコメント
}

const COMMENT: { [key: string]: CommentType } = {
    default: {
        ML: {
            startsWith: ['/*'],
            endsWith: ['*/']
        },
        SL: {
            startsWith: ['//'],
            endsWith: ['\n']
        }
    },
    python: {
        ML: {
            startsWith: ['\'\'\'', '"""'],
            endsWith: ['\'\'\'', '"""']
        },
        SL: {
            startsWith: ['#'],
            endsWith: ['\n']
        }
    }
};

const charUnicodeEscape = (charCode: number): string => {
    // UTF-16コードユニット内のASCII文字セット以外をエスケープ
    if (charCode > 0x007f && charCode <= 0xffff) {
        const zeroPadding = '0000';
        const charCodeHex = charCode.toString(16);
        const paddingSize = zeroPadding.length - charCodeHex.length;

        return '\\u' + zeroPadding.substring(0, paddingSize) + charCodeHex;
    }
    return '';
}

export const native2ascii = (nativeStr: string, igcomment?: string): string => {
    if (!igcomment) {
        // コメント無変換処理なし（全変換）
        const asciiCharArray = nativeStr.split('').map(c => ((c.charCodeAt(0) > 0x7f) ? charUnicodeEscape(c.charCodeAt(0)) : c));

        return asciiCharArray.join('');
    } else {
        // コメント無変換処理あり
        // マルチラインコメントの言語別定義を取得
        const MLCOMMENT: Comments = COMMENT[igcomment].ML;
        // シングルラインコメントの言語別定義を取得
        const SLCOMMENT: Comments = COMMENT[igcomment].SL;
        // マルチラインコメントの文字数を取得
        const nstartMCMT = MLCOMMENT.startsWith[0].length;
        const nendMCMT = MLCOMMENT.endsWith[0].length;
        // シングルラインコメントの文字数を取得
        const nstartSCMT = SLCOMMENT.startsWith[0].length;
        const nendSCMT = SLCOMMENT.endsWith[0].length;

        // コメントフラグ初期化
        let isMLComment = false;
        let isSLComment = false;

        // エンコード済み文字列
        let asciiStr = '';

        for (let i = 0; i < nativeStr.length; i++) {
            const charCode: number = nativeStr[i].charCodeAt(0);

            // コメントの有無をチェック
            if (MLCOMMENT.startsWith.some(c => c == nativeStr.substring(i, i + nstartMCMT)) && !isMLComment) {
                // マルチラインコメント開始
                isMLComment = true;
            } else if (SLCOMMENT.startsWith.some(c => c == nativeStr.substring(i, i + nstartSCMT)) && !isSLComment) {
                // シングルラインコメント開始
                isSLComment = true;
            } else if (MLCOMMENT.endsWith.some(c => c == nativeStr.substring(i, i + nendMCMT))) {
                // マルチラインコメント終了
                isMLComment = false;
            } else if (SLCOMMENT.endsWith.some(c => c == nativeStr.substring(i, i + nendSCMT)) && isSLComment && !isMLComment) {
                // シングルラインコメント終了
                isSLComment = false;
            }

            // ASCII文字以外でコメント無変換処理なしの場合のみエスケープ文字に変換
            if (charCode > 0x7f && !isMLComment && !isSLComment) {
                asciiStr += charUnicodeEscape(charCode);
            } else {
                asciiStr += nativeStr[i];
            }
        }

        return asciiStr;
    }
}

export const ascii2native = (asciiStr: string): string => {
    // エスケープ文字列\uXXXXで文字列を分割してその文字列だけ0xXXXXに変換した後
    // 文字コードをネイティブ文字に戻す
    const nativeCharArray = asciiStr.split(/(\\u[0-9a-f]{4})/).map((c: string): string => {
        if (c.startsWith('\\u')) {
            return String.fromCharCode(parseInt(c.replace('\\u', '0x'), 16));
        }
        return c;
    });

    return nativeCharArray.join(''); // 分割された文字列を結合
}

// CLIパラメータ処理
const params = parse(Deno.args, {
    'boolean': true // --（ダブルハイフン）パラメータに=がない場合trueとする
});

const inFilename = params._[0] as string;
const outFilename = params._[1] as string;
const isReverse = !!params.reverse; // 未指定時はfalseとする
// 未指定時はfalse、言語指定がある場合はその文字列、言語指定がない場合はそのままtrue
const ignoreComments = !params['ignore-comments'] ? false : params['ignore-comments'];

let inText = await '';

if (!!inFilename) {
    inText = await Deno.readTextFile(inFilename);
} else {
    // 入力ファイル名がない場合は標準入力から取り込む
    const buf = new Uint8Array(1024);
    const n = < number > await Deno.stdin.read(buf);
    inText = await new TextDecoder().decode(buf.subarray(0, n));
}

let outText = await '';

if (isReverse) {
    // --reverseあり（ascii2native: デコード）
    outText = ascii2native(inText);
} else {
    // --reverseなし（native2ascii: エンコード）
    if (!ignoreComments) {
        // --ignore-commentsなし
        outText = native2ascii(inText);
    } else if (ignoreComments === true) {
        // --ignore-commentsのみ
        outText = native2ascii(inText, 'default');
    } else {
        // --ignore-commentsで言語指定あり
        outText = native2ascii(inText, ignoreComments);
    }
}

if (!!outText) {
    if (!!outFilename) {
        Deno.writeTextFile(outFilename, outText);
    } else {
        // 出力ファイル名がない場合は標準出力に書き出す
        Deno.writeAll(Deno.stdout, new TextEncoder().encode(outText));
    }
}