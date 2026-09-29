import { Request, Response } from 'express';
import { LabService } from '../services/LabService.js';

export class LabController {
  constructor(private labService: LabService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const labs = await this.labService.listLabs();
      res.json({ success: true, data: labs });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const lab = await this.labService.getLab(id);
      if (!lab) {
        res.status(404).json({ success: false, error: `Lab '${id}' not found` });
        return;
      }
      res.json({ success: true, data: lab });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };

  public start = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.labService.startLab(id);
      res.json({ success: result.ok, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };

  public stop = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.labService.stopLab(id);
      res.json({ success: result.ok, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };

  public reset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.labService.resetLab(id);
      res.json({ success: result.ok, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };

  public validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.labService.validateLab(id);
      res.json({ success: result.ok, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };

  public getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.labService.getLabStatus(id);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };
}
