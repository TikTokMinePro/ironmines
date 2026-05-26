-- One-time cleanup: delete English-only videos from viral_videos
-- These are videos with fully English captions that shouldn't be in the BR dataset
DELETE FROM viral_videos WHERE id IN (
  '41c9afd9-5df7-4cc1-a18a-3347a87cb81d',
  '4a325d63-d2b4-4584-be69-960bc900a2f2',
  'd273420c-3d48-44f6-834c-d318f6f42857',
  '36d4fbac-1e3d-48b0-b707-9c903449350e',
  'fa5901a7-7cd6-4a25-8432-837478a10b00',
  '2c6b7f90-8429-4c71-8f57-88446e5d4a01',
  '9ae33713-3a12-4b10-acdd-03cae3e87a9f',
  '491f51f3-847c-4eab-975d-1f839d74c3cc',
  '55512335-1c87-4766-95c7-0142a2cd315e'
);