<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>No. Project : {{$row->no_project}}</title>

    <style>
        html,
        body {
            margin: 10px;
            padding: 10px;
            font-family: sans-serif;
        }
        h1,h2,h3,h4,h5,h6,p,span,label {
            font-family: sans-serif;
            font-size: 11px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0px !important;
        }
        table thead th {
            height: 12px;
            text-align: center;
            font-size: 11px;
            font-family: sans-serif;
        }
        table, th, td {
            border: 1px solid #ddd;
            padding: 5px;
            font-size: 11px;
        }

        .heading {
            font-size: 12px;
            margin-top: 12px;
            margin-bottom: 12px;
            font-family: sans-serif;
        }
        .small-heading {
            font-size: 18px;
            font-family: sans-serif;
        }
        .total-heading {
            font-size: 12px;
            font-weight: 700;
            font-family: sans-serif;
        }
        .order-details tbody tr td:nth-child(1) {
            width: 20%;
        }
        .order-details tbody tr td:nth-child(3) {
            width: 20%;
        }

        .text-start {
            text-align: left;
        }
        .text-end {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .company-data span {
            margin-bottom: 4px;
            display: inline-block;
            font-family: sans-serif;
            font-size: 11px;
            font-weight: 400;
        }
        .no-border {
            border: 1px solid #fff !important;
        }
        .bg-blue {
            background-color: #e04c3c;
            color: #fff;
        }
    </style>
</head>
<body>

    <table class="order-details">
        <thead>
            <tr>
                <th width="50%" colspan="5" align="center">
                    <h2>Surat Perintah Kerja</h2>
                </th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td rowspan="3" align="center"><img src="https://smartone.id/wp-content/uploads/2024/05/logo.png" style="width:90px;"></td>
                <td>No Invoice</td>
                <td>{{$row->invoice}}</td>

                <td>No Project</td>
                <td>{{$row->no_project}}</td>
            </tr>
            
            <tr>
                <td>Revisi</td>
                <td></td>
                
                <td>No. SPK</td>
                <td>{{$row->spk}}</td>
            </tr>
            
            <tr>
                <td>Estimasi</td>
                <td>{{ \Carbon\Carbon::parse($row->est_order)->format('d/m/Y')}}</td>

                <td>Tanggal</td>
                <td>{{ \Carbon\Carbon::parse($row->created_at)->format('d/m/Y')}}</td>
            </tr>
        </tbody>
    </table>
    
    <h1>1. Detail Order</h1>

    <table width="100%">
        <thead>
            <tr>
                <th align="center" width="30%">KETERANGAN</th>
                <th align="center" width="40%">DESKRIPSI</th>
                <th align="center" width="20%">CATATAN</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $string = $row->capture;
            $string = substr($string,18);
            ?>
            <tr>
                <td>1. Asal Bahan</td>
                <td>{{$row->asal_bahan}}</td>
                <td rowspan="8">
                @if($row->catatan_design !== NULL)
                Catatan Designer: 
                <p style="font-size:15px;font-weight: bold;color:red;">{{ $row->catatan_design }}</p>
                @endif
                @if($row->catatan_design == NULL )    
                
                @endif
                </td>
            </tr>
            <tr>
                <td>2. Nama Kain</td>
                <td>{{$row->nama_kain}}</td>
            </tr>
            <tr>
                <td>3. Jumlah Kain</td>
                <td>{{$row->jumlah_kain}}</td>
            </tr>
            <tr>
                <td>4. Lebar Kertas</td>
                <td>{{$row->lebar_kertas}}</td>
            </tr>
            <tr>
                <td>5. Aplikasi Produk</td>
                <td>{{$row->nama_produk}}</td>
            </tr>
            <tr>
                <td>6. Quantity Produksi</td>
                <td>{{$row->qty}}</td>
            </tr>
            <tr>
                <td>7. Panjang Layout</td>
                <td>{{$row->lebar_kertas}} X {{$row->qty}}</td>
            </tr>
            <tr>
                <td>8. Nama File</td>
                <td>{{$row->path}}</td>
            </tr>
        </tbody>
    </table>
    
    <h1>2. Preview Project</h1>
    
    <table width="100%">
        <tbody>
            <tr>
                <td rowspan="2" colspan="3" align="center" style="font-size:20px">{{$rowx->nama}}</td>
                <td>Marketing</td>
            </tr>
            <tr>
                <td>{{$rowm->name}}</td>
            </tr>
            <tr>
                <td align="center" colspan="3">
                <p style="color:red;font-size:18px;font-weight: bold;">{{$row->produk}}</p>
                    <p style="color:red;font-size:16px;font-weight: bold;">{{$row->kategori}}</p>
                    <img style="max-height:180px;max-width:230px;" src="{{asset('')}}{{($row->capture)}}">
                    <img style="max-height:120px;max-width:280px;" src="{{asset('')}}{{($row->capture_name)}}">
                </td>
                <td>
                    <table cellspacing="0" cellpadding="0">
                        <tr>
                            <td>Lebar Kertas</td>
                            <td><input type="text" style="border: 2px solid green;" value="{{$row->lebar_kertas}}" disabled></td>
                        </tr>
                        <tr>
                            <td>Gramasi Kertas</td>
                            <td><input type="text" style="border: 2px solid green;" value="{{$row->gramasi}}" disabled></td>
                        </tr>
                        <tr>
                            <td>Lebar Kain</td>
                            <td><input type="text" style="border: 2px solid green;" value="{{$row->lebar_kain}}" disabled></td>
                        </tr>
                        <tr>
                            <td>Lebar File</td>
                            <td><input type="text" style="border: 2px solid green;" value="{{$row->lebar_file}}" disabled></td>
                        </tr>
                        <tr>
                            <td>Warna Acuan</td>
                            <td><input type="text" style="border: 2px solid green;" value="{{$row->warna_acuan}}" disabled></td>
                        </tr>
                        <tr>
                            <td>Status Produksi</td>
                            <td><input type="text" style="border: 2px solid green;" value="{{$row->statusprod}}" disabled></td>
                        </tr>
                    </table><br>
                    Catatan: 
                    <p style="font-size:15px;font-weight: bold;color:red;">{{ $row->catatan }}</p>
                    <br>
                    <br>
            </tr>
            <tr align="center">
                <td width="25%">Created by<br>{{$rowa->name}}</td>
                <td width="25%">Designed by<br>{{$rowd->name}}</td>
                <td width="25%">Operation Approval by<br>{{$rowo->name}}</td>
                <td width="25%">Approved by<br>{{$rowmn->name}}</td>
            </tr>
        </tbody>
    </table>
<br>
    <br>
    <p class="text-center">
        smartone.id
    </p>

</body>
</html>