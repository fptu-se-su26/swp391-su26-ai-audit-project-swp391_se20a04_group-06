import { NextFunction, Request, Response } from "express";
import { landingBatchService } from "../services/landingBatch.service";

export async function listLandingBatches(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(await landingBatchService.listPublic(req.query));
  } catch (error) {
    next(error);
  }
}

export async function listMarketplaceLandingBatches(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(await landingBatchService.listMarketplace(req.query));
  } catch (error) {
    next(error);
  }
}

export async function listMyLandingBatches(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(
      await landingBatchService.listMine(req.user.userId, req.query),
    );
  } catch (error) {
    next(error);
  }
}

export async function listAdminLandingBatches(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(await landingBatchService.listAdmin(req.query));
  } catch (error) {
    next(error);
  }
}

export async function getLandingBatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(await landingBatchService.getById(req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createLandingBatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res
      .status(201)
      .json(await landingBatchService.create(req.user.userId, req.body));
  } catch (error) {
    next(error);
  }
}

export async function updateLandingBatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(
      await landingBatchService.update(req.params.id, req.user, req.body),
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteLandingBatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(
      await landingBatchService.softDelete(req.params.id, req.user),
    );
  } catch (error) {
    next(error);
  }
}

export async function addLandingBatchProducts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.status(201).json(
      await landingBatchService.addProducts(
        req.params.id,
        req.user,
        req.body.products,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createLandingBatchFromBoatLog(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.status(201).json(
      await landingBatchService.createFromBoatLog(req.params.id, req.user),
    );
  } catch (error) {
    next(error);
  }
}
