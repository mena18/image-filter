import express, { Request, Response } from "express";

import bodyParser from "body-parser";
import {
  filterImageFromURL,
  deleteLocalFiles,
  isValidUrl,
  requireAuth,
  logMiddleware,
} from "./util/util";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
require("dotenv").config();

(async () => {
  // Init the Express application
  const app = express();

  // basic middleware to view basic logs just for development
  app.use(logMiddleware);

  // Set the network port
  const port: Number = parseInt(process.env.PORT) || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  app.get("/token", async (req: Request, res: Response) => {
    // this is endpoint to request new token
    // the content of the token at the moment is irrelevant because i am not building authentication system
    // so i just added a number

    const token = jwt.sign(
      { data: Math.floor(Math.random() * 100000) },
      process.env.JWT_TOKEN
    );

    res.send(token);
  });

  // endpoint to filter an image from a public url.
  app.get(
    "/filteredimage",
    requireAuth,
    async (req: Request, res: Response) => {
      // get and validate the image_url query
      const { image_url } = req.query;
      if (!image_url) {
        return res.status(400).send(`image_url is required`);
      }
      if (!isValidUrl(image_url)) {
        return res.status(400).send(`image url is not a valid url`);
      }

      /*  
      call filterImageFromURL(image_url) to filter the image
      and if it succeed return the file then delete it from the server
      if error occured while processing the image return error message
    */

      try {
        const file: string = await filterImageFromURL(image_url);
        return res.sendFile(file, (err) => {
          deleteLocalFiles([file]);
        });
      } catch (err) {
        console.log(
          "failed to process image this is an issue with the jimp package"
        );
        // console.log(err);
        return res
          .status(500)
          .send("image can't be processed plase try another image");
      }
    }
  );

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req: Request, res: Response) => {
    res.send("try GET /filteredimage?image_url={{}}");
  });

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();
