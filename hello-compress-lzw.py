import pathlib 
import rasterio
from rasterio.enums import Compression

def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


raster_folder = '/mnt/d/mapbiomas-lulc/MAPBIOMAS-LULC-MATAATLANTICA-CLP'

if __name__ == '__main__':
    files = files_from_folder(raster_folder)
    for en, file in enumerate(files):
        print(en,'-',file)

        with rasterio.open(file, 'r') as src:
            profile = src.profile
            profile.update(compression=Compression.lzw)

            with rasterio.open(file.replace('.clp.tif', '.clp.lzw.tif'), 'w', **profile) as dst:
                data = src.read(1)
                dst.write(data, 1)