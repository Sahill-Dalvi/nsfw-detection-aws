const AWS = require("aws-sdk");
const textract = new AWS.Textract();
const s3 = new AWS.S3();
const sns = new AWS.SNS();
const snsTopicARN = process.env.SNS_TOPIC_ARN;

const nsfwWordList = [
  "explicit",
  "nudity",
  "porn",
  "xxx",
  "adult",
  "offensive",
  "vulgar",
  "inappropriate",
  "obscene",
  "indecent",
  "dirty",
  "erotic",
  "sexual",
  "sensitive",
];

const containsNSFWWords = (text) => {
  const words = text.split(/\s+/);
  for (const word of words) {
    if (nsfwWordList.includes(word.toLowerCase())) {
      return true;
    }
  }
  return false;
};

const highlightNSFWWords = (text, nsfwWords) => {
  return text.replace(
    new RegExp(`\\b(${nsfwWords.join("|")})\\b`, "gi"),
    (match) => {
      return `\u25A0${match}\u25A0`;
    }
  );
};

exports.handler = async (event, context) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    console.log(event);
    console.log(event["base64File"]);
    const base64File = event["base64File"];
    const key = event.key;

    const fileBuffer = Buffer.from(base64File, "base64");

    const detectTextParams = {
      Document: {
        Bytes: fileBuffer,
      },
    };

    const detectTextResponse = await textract
      .detectDocumentText(detectTextParams)
      .promise();
    const extractedText = detectTextResponse.Blocks.filter(
      (block) => block.BlockType === "LINE"
    )
      .map((block) => block.Text)
      .join("\n");

    console.log("Extracted Text:", extractedText);

    if (containsNSFWWords(extractedText)) {
      const nsfwWords = extractedText
        .split(/\s+/)
        .filter((word) => nsfwWordList.includes(word.toLowerCase()));
      const highlightedText = highlightNSFWWords(extractedText, nsfwWords);

      const txtContent = `***************************
*  Important Information  *
***************************

The Unicode square character (■) is used to highlight specific words in this document. Please pay attention to any words enclosed in square characters as they are significant.

****************************
*  NSFW Content Detected   *
****************************

${highlightedText}

****************************
*  End of Document        *
****************************`;

      const txtBucket = "store-nsfw-docs";
      const txtKey = key.replace(".pdf", "") + ".txt";
      const txtParams = {
        Bucket: txtBucket,
        Key: txtKey,
        Body: txtContent,
        ContentType: "text/plain",
        ContentDisposition: 'attachment; filename="result.txt"',
      };

      const uploadResult = await s3.putObject(txtParams).promise();

      const linkExpirationSeconds = 3600;
      const s3Params = {
        Bucket: txtBucket,
        Key: txtKey,
        Expires: linkExpirationSeconds,
      };
      const txtDownloadLink = await s3.getSignedUrlPromise(
        "getObject",
        s3Params
      );
      console.log("TXT Download Link:", txtDownloadLink);

      // Send SNS notification
      const snsParams = {
        Message: `NSFW content detected in the uploaded document:  ${key}`,
        Subject: "NSFW Content Detected",
        TopicArn: snsTopicARN,
      };
      console.log("Sending NSFW content notification using SNS...");
      await sns.publish(snsParams).promise();

      console.log("NSFW content detected!");
      return {
        statusCode: 200,
        body: {
          message: "NSFW content detected!",
          txtDownloadLink: txtDownloadLink,
        },
      };
    } else {
      console.log("NSFW content not detected!");
      return {
        statusCode: 200,
        body: {
          message: "NSFW content not detected!",
          extractedText: extractedText,
        },
      };
    }
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      body: { message: "Error processing the PDF file." },
    };
  }
};
