import { Router } from 'express';
import { IdParams, PhotoBody, type Photo } from '@fuellog/shared';
import { h, HttpError, unwrap } from '../middleware/errors';
import { notFuture, validate } from '../middleware/validate';

const BUCKET = 'progress-photos';
const SIGNED_URL_SECONDS = 60 * 60;
type Row = { id: string; log_date: string; storage_path: string };

export const photosRouter = Router();

photosRouter.get('/photos', h(async (req, res) => {
  const rows: Row[] = unwrap(await req.sb.from('progress_photos').select('id,log_date,storage_path').order('log_date', { ascending: false }).order('created_at', { ascending: false }));
  if (!rows.length) return res.json([]);
  const signed = await req.sb.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.storage_path), SIGNED_URL_SECONDS);
  if (signed.error) throw new HttpError(500, 'server_error', 'Could not load your photos. Try again.');
  const urls = new Map(signed.data.map((s) => [s.path, s.signedUrl]));
  const photos: Photo[] = rows.map((r) => ({ id: r.id, log_date: r.log_date, url: urls.get(r.storage_path) ?? null }));
  res.json(photos);
}));

photosRouter.post('/photos', validate({ body: PhotoBody }), notFuture, h(async (req, res) => {
  const { log_date, storage_path } = req.body;
  if (!storage_path.startsWith(`${req.userId}/`)) throw new HttpError(400, 'validation', 'That photo is not in your folder.');
  const row: Row = unwrap(await req.sb.from('progress_photos').insert({ user_id: req.userId, log_date, storage_path }).select('id,log_date,storage_path').single());
  res.status(201).json({ id: row.id, log_date: row.log_date });
}));

photosRouter.delete('/photos/:id', validate({ params: IdParams }), h(async (req, res) => {
  const row: Row = unwrap(await req.sb.from('progress_photos').select('id,log_date,storage_path').eq('id', req.params.id).single());
  const removed = await req.sb.storage.from(BUCKET).remove([row.storage_path]);
  if (removed.error) throw new HttpError(500, 'server_error', 'Could not delete that photo. Try again.');
  unwrap(await req.sb.from('progress_photos').delete().eq('id', row.id));
  res.status(204).end();
}));
