--
-- PostgreSQL database dump
--

\restrict SGF89HXSO7C7fn3BcxdcQFXpBSEJQxD3ij49LR1w15rFdSkEa7SVQQMn6BKK9xf

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg12+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg12+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    resource_type character varying(100),
    resource_id character varying(255),
    ip_address character varying(45),
    details character varying(1000),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid NOT NULL,
    owner_id uuid NOT NULL,
    title character varying(500) DEFAULT 'New Conversation'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_chunks (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    page_number integer,
    text text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_embeddings (
    id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    model_name character varying(255) NOT NULL,
    model_version character varying(100) DEFAULT '1.0'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    embedding public.vector(384)
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid NOT NULL,
    owner_id uuid NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(500) NOT NULL,
    file_path character varying(1000) NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'uploaded'::character varying NOT NULL,
    checksum character varying(64),
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ingestion_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingestion_jobs (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    status character varying(50) DEFAULT 'queued'::character varying NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    error_code character varying(100),
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: message_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_sources (
    id uuid NOT NULL,
    message_id uuid NOT NULL,
    document_id uuid NOT NULL,
    chunk_id uuid,
    page_number integer,
    document_name character varying(500)
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
0002
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, ip_address, details, created_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, owner_id, title, created_at, updated_at) FROM stdin;
855cbf25-5276-4c6e-ba1d-9a993bead59f	b98b02cb-f3e9-46bc-8583-5ed527269fa1	apa isi dokumen?	2026-10-13 07:02:03.589772+00	2026-10-13 07:02:03.589772+00
7c24e178-10a5-406a-9203-5085af4e860b	b98b02cb-f3e9-46bc-8583-5ed527269fa1	apa itu RAG dan bagaimana cara kerjanya?	2026-10-13 07:20:27.734716+00	2026-10-13 07:20:27.734716+00
d1d75079-18b0-4fe0-9096-b15fc6a39212	b98b02cb-f3e9-46bc-8583-5ed527269fa1	apa isi test laporan ?	2026-10-13 07:51:25.469125+00	2026-10-13 07:51:25.469125+00
8d63e821-4582-437e-bd97-8b815b34528b	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Berapa pendapatan perusahaan ABC pada tahun 2024?	2026-10-13 07:54:24.497129+00	2026-10-13 07:54:24.497129+00
d8f3046c-406f-4694-96e1-ef2d3f1b4376	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Apa rencana ekspansi perusahaan ABC untuk tahun 2025?	2026-10-13 07:54:24.60559+00	2026-10-13 07:54:24.60559+00
da3ecdfc-b340-4f60-87e1-145b586bbb2e	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Berapa jumlah karyawan perusahaan ABC?	2026-10-13 07:54:24.700669+00	2026-10-13 07:54:24.700669+00
08ae2b0f-2ed6-44a7-ace5-f7d26f54b399	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Berapa pendapatan perusahaan ABC pada tahun 2024?	2026-10-13 08:01:56.183798+00	2026-10-13 08:01:56.183798+00
21bd4e49-659f-4378-bbd3-12156f3f05c5	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Apa rencana ekspansi perusahaan ABC untuk tahun 2025?	2026-10-13 08:01:56.271245+00	2026-10-13 08:01:56.271245+00
5db1424e-9111-493c-9439-c590fe38baac	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Berapa jumlah karyawan perusahaan ABC?	2026-10-13 08:01:56.334687+00	2026-10-13 08:01:56.334687+00
b16bfa12-ef60-4719-96c9-9b675ed2dea2	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Berapa pendapatan perusahaan ABC pada tahun 2024?	2026-10-13 08:14:51.421506+00	2026-10-13 08:14:51.421506+00
a492136b-57c4-495f-9c08-cb963d9fcdc8	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Apa rencana ekspansi perusahaan ABC untuk tahun 2025?	2026-10-13 08:14:51.651015+00	2026-10-13 08:14:51.651015+00
ff04ca88-f514-4111-87d9-80c4f67b487d	b98b02cb-f3e9-46bc-8583-5ed527269fa1	Berapa jumlah karyawan perusahaan ABC?	2026-10-13 08:14:51.749085+00	2026-10-13 08:14:51.749085+00
\.


--
-- Data for Name: document_chunks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_chunks (id, document_id, chunk_index, page_number, text, metadata, created_at) FROM stdin;
0f79c58f-1f56-4b33-a3ea-c103ac0a05d1	24e2bebe-bd39-464d-88e1-c78cef446c30	0	1	LAPORAN TAHUNAN PERUSAHAAN ABC 2024 1. PENDAHULUAN Perusahaan ABC didirikan tahun 2010 di bidang teknologi informasi. Pendapatan 2024 mencapai Rp 50 miliar. 2. PRODUK UNGGULAN - Sistem Manajemen Dokumen digunakan 200 perusahaan di Indonesia. - Platform AI Chatbot untuk customer service 24 jam. - Cloud Storage kapasitas hingga 10 TB per klien. 3. PENCAPAIAN 2024 Sertifikasi ISO 27001 untuk keamanan informasi berhasil diperoleh. Tim RnD menghasilkan 5 paten teknologi baru. Karyawan meningkat dari 150 menjadi 250 orang. 4. RENCANA 2025 Ekspansi ke Malaysia dan Singapura mulai Q1 2025. Target pendapatan Rp 80 miliar pada akhir 2025.	{"doc_name": "test_laporan.pdf", "owner_id": "b98b02cb-f3e9-46bc-8583-5ed527269fa1"}	2026-10-13 07:46:58.417227+00
\.


--
-- Data for Name: document_embeddings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_embeddings (id, chunk_id, model_name, model_version, created_at, embedding) FROM stdin;
fcf594d7-f979-44ad-ac88-897ef2124b44	0f79c58f-1f56-4b33-a3ea-c103ac0a05d1	all-MiniLM-L6-v2	1.0	2026-10-13 07:46:58.472746+00	[-0.03637369,0.09479846,-0.01815912,-0.03533348,-0.07515842,-0.0335651,0.02232818,0.03440287,0.00706319,0.02853129,0.09065832,-0.04219276,-0.01293386,0.01121319,0.02606248,-0.08977529,-0.00723193,-0.07692702,-0.06280316,-0.05976788,0.05270922,-0.04282093,-0.0276322,-0.06949132,-0.05903097,-0.01914868,0.01201627,0.00656681,-0.02142718,-0.08538175,0.01058278,0.08748914,-0.01621388,-0.05208502,-0.00253135,0.03207658,-0.06750137,0.00173587,0.0629902,0.01275564,0.01108147,-0.07647575,-0.05269948,-0.09437389,0.07665871,-0.05326492,-0.07718053,0.03085682,0.02058803,0.01831497,-0.07855062,0.02914174,-0.00236648,-0.01515938,-0.02240322,-0.18006615,-0.03464246,0.02305816,-0.00549433,-0.02305825,0.010858,0.0256907,-0.04742895,-0.03001428,0.03339911,-0.02339147,-0.03772972,-0.00891948,-0.02413826,0.04777723,-0.05450946,0.01486612,0.00439757,0.02725698,-0.09072757,-0.03815427,0.06333083,0.03968258,0.04034065,0.00264757,0.04599258,0.01400077,-0.01477231,-0.02701596,-0.07868965,-0.01204715,-0.02000768,0.02513379,0.02012714,-0.00901307,0.05458178,0.0768556,0.01652682,0.04384007,-0.07165813,-0.01039248,-0.11203956,-0.02239514,-0.07712212,0.02273839,0.05116312,0.00159907,0.01736008,-0.08776218,-0.08881761,-0.04570556,0.03864824,-0.07170676,0.09030473,0.02024623,-0.16924077,-0.02546716,-0.10916654,-0.0774653,-0.04535083,0.01502523,-0.0954637,0.00752488,0.01188485,0.00633202,0.02994556,-0.05655592,-0.03964702,-0.06496279,-0.0207111,-0.01314804,0.04608067,0,-0.042329,-0.03233167,0.04991008,0.00718068,0.0323542,-0.02690126,0.0062472,-0.04782989,0.03152247,-0.09975813,-0.06014582,-0.04718095,-0.06459913,-0.01594649,0.0761499,-0.02407699,0.063999,0.02582734,-0.02772886,0.06368238,0.0562138,-0.01014387,-0.00359705,-0.04375076,0.09909603,0.07055168,-0.03378159,-0.05880119,0.03276066,0.06948669,0.04283427,0.00682788,-0.06192791,-0.06193211,-0.0960357,-0.04230661,-0.02951116,-0.05649971,-0.06054296,-0.02716067,-0.02864509,0.00042787,0.04803444,0.05710492,0.05102368,0.02403751,0.03050525,0.01784223,0.01897904,0.0712229,-0.12499622,0.03863898,-0.06119033,0.01939708,0.03026261,-0.0440279,0.02465482,-0.03130072,0.00642113,-0.00425941,-0.05994686,-0.02291858,0.03225518,-0.01382624,0.00303286,-0.02179151,0.02994624,0.02279898,0.04596712,-0.02424441,0.01239615,-0.03383454,0.00997844,0.11120808,-0.04088566,-0.01411623,0.06613068,0.08029812,-0.01163641,0.07444286,0.00655484,0.04442435,0.0083805,-0.07135756,0.06942259,0.0431009,0.04880179,0.00646581,0.06793424,0.0506974,-0.02455346,0.10177571,-0.03494506,0.0482458,-0.01217752,-0,0.0501059,0.03622498,-0.051588,0.02716848,-0.00845799,0.03268719,0.01125391,0.05020358,0.04852011,0.02300197,-0.0880218,-0.02691933,0.07531357,0.00883021,-0.06036598,0.0710442,0.05696955,-0.00029307,-0.013237,-0.02750253,-0.04418417,0.09837665,-0.035556,0.07323056,0.02853443,0.02711229,0.00970312,-0.03318466,-0.0614004,0.00472365,-0.00752013,-0.11080445,-0.1032714,0.12607959,-0.03452526,-0.1322825,0.10242989,-0.02043843,-0.02854201,0.13096957,0.08026426,0.04631541,-0.01387098,-0.00611309,-0.07240903,-0.0904203,0.01701269,-0.06123513,0.04486532,-0.08601036,0.12589554,0.03313265,0.02526136,0.02503223,0.03893933,0.04757926,0.09198859,0.01364183,-0.07688878,-0.02283061,-0.00020838,0.02875247,0.01149614,0.03188965,0.07559983,0.00772382,0.11060564,0.05102519,0.00455785,-0.08432765,-0.02391187,-0.09633619,0.01324732,-0.00252705,-0.00345676,0.05014376,-0.03267689,0.03579581,0.04250405,-0.01465388,0.00246086,-0.03970202,-0.02418946,-0.0236502,0.00924119,-0.00013177,0.03275843,-0.05909279,0.00299851,0.00382996,-0.03453382,0.00634281,0.02129189,0.11945201,0.06149999,-7e-08,0.0172155,-0.0773558,0.00962183,0.02428006,0.01294095,-0.0216744,-0.02747783,0.01200823,0.01013686,0.03442492,0.01553684,-0.0127856,-0.02304639,0.05077773,-0.03408096,0.00242247,0.0813658,0.06399055,-0.01210222,-0.04374692,0.05780848,-0.01445763,-0.01610406,-0.01872716,0.03432762,0.00965634,0.03154666,0.05180304,0.00758144,-0.02513156,-0.08287607,-0.05075115,-0.01206838,-0.05106164,0.01049478,0.03264749,-0.01718379,-0.00215742,-0.01255978,0.06281764,0.0334211,-0.0541033,0.02915892,-0.02675103,0.03515249,-0.01373337,-0.03856548,-0.01334212,-0.01396586,-0.09449126,-0.08308845,0.01163076,0.08288392,0.01034947,0.01870101,0.03637899,-0.03621209,0.07035888,0.01890449,0.03371662,0.08981594,-0.01380707,-0.09953151,0.02906874]
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, owner_id, filename, original_name, file_path, file_size, mime_type, status, checksum, is_deleted, created_at, updated_at) FROM stdin;
a91958df-2c22-461f-a176-34c50060f782	b98b02cb-f3e9-46bc-8583-5ed527269fa1	6383d9f9-c8f4-47a7-9cd8-4bff2f28d6fa.pdf	Modul Developing & Deploying AIML Applications with Docker & OpenShift AI.pdf	/app/data/uploads/6383d9f9-c8f4-47a7-9cd8-4bff2f28d6fa.pdf	1377844	application/pdf	deleted	6e99244b203434434ac4788942be62f94a2a65fc8f4a3a33128bcc1afc67fd1f	t	2026-10-13 04:16:41.873223+00	2026-10-13 04:29:12.142851+00
dd2631f5-f0eb-4bc9-b55b-ddfac87adaf6	b98b02cb-f3e9-46bc-8583-5ed527269fa1	b0380722-384a-48e0-b64c-07c986345e58.pdf	Modul Developing & Deploying AIML Applications with Docker & OpenShift AI.pdf	/app/data/uploads/b0380722-384a-48e0-b64c-07c986345e58.pdf	1377844	application/pdf	deleted	6e99244b203434434ac4788942be62f94a2a65fc8f4a3a33128bcc1afc67fd1f	t	2026-10-13 04:30:48.847639+00	2026-10-13 04:30:59.116465+00
f4a299aa-1f0f-4162-8c42-1fa13b12e305	b98b02cb-f3e9-46bc-8583-5ed527269fa1	f6391d56-f7e9-423b-a88e-eb191677c5d2.pdf	Modul Developing & Deploying AIML Applications with Docker & OpenShift AI.pdf	/app/data/uploads/f6391d56-f7e9-423b-a88e-eb191677c5d2.pdf	1377844	application/pdf	deleted	6e99244b203434434ac4788942be62f94a2a65fc8f4a3a33128bcc1afc67fd1f	t	2026-10-13 04:41:17.695398+00	2026-10-13 06:25:05.740978+00
dbe073ea-37cd-4a2a-9e71-d7f29c912c54	b98b02cb-f3e9-46bc-8583-5ed527269fa1	db992454-b846-4bf0-8426-ba493970413f.pdf	Modul Developing & Deploying AIML Applications with Docker & OpenShift AI.pdf	/app/data/uploads/db992454-b846-4bf0-8426-ba493970413f.pdf	1377844	application/pdf	deleted	6e99244b203434434ac4788942be62f94a2a65fc8f4a3a33128bcc1afc67fd1f	t	2026-10-13 06:39:12.753702+00	2026-10-13 06:40:35.94525+00
24e2bebe-bd39-464d-88e1-c78cef446c30	b98b02cb-f3e9-46bc-8583-5ed527269fa1	a722231d-bcc6-4dc0-ba95-60112670be1e.pdf	test_laporan.pdf	/app/data/uploads/a722231d-bcc6-4dc0-ba95-60112670be1e.pdf	1494	application/pdf	completed	8897fc2955eaf0af53874bf9b4d19d677966be3ca843ced7e4cf7748fda1df7a	f	2026-10-13 07:29:29.059257+00	2026-10-13 07:46:58.481454+00
0e978792-8612-450a-9095-902fc5c06248	b98b02cb-f3e9-46bc-8583-5ed527269fa1	2fdb7d6b-fdc7-4636-aeb7-0b20330fe9a7.pdf	test_laporan.pdf	/app/data/uploads/2fdb7d6b-fdc7-4636-aeb7-0b20330fe9a7.pdf	1494	application/pdf	deleted	8897fc2955eaf0af53874bf9b4d19d677966be3ca843ced7e4cf7748fda1df7a	t	2026-10-13 07:03:31.676592+00	2026-10-13 07:20:57.893348+00
f62fdf35-ba23-4d53-a610-6c8d93306a5f	b98b02cb-f3e9-46bc-8583-5ed527269fa1	e58004cd-1da8-44dd-be4d-a7c034372bc7.pdf	Modul Developing & Deploying AIML Applications with Docker & OpenShift AI.pdf	/app/data/uploads/e58004cd-1da8-44dd-be4d-a7c034372bc7.pdf	1377844	application/pdf	deleted	6e99244b203434434ac4788942be62f94a2a65fc8f4a3a33128bcc1afc67fd1f	t	2026-10-13 06:43:30.847221+00	2026-10-13 07:20:59.433873+00
\.


--
-- Data for Name: ingestion_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ingestion_jobs (id, document_id, status, attempt_count, error_code, started_at, finished_at, created_at) FROM stdin;
ff16ebf4-e345-4bc0-a006-674498eaddf0	a91958df-2c22-461f-a176-34c50060f782	failed	0	\N	\N	\N	2026-10-13 04:16:41.873223+00
7fefba27-ea7b-4eb7-b3ef-dd7cae6137f2	dd2631f5-f0eb-4bc9-b55b-ddfac87adaf6	failed	0	\N	\N	\N	2026-10-13 04:30:48.847639+00
1727757a-a077-476d-aaad-6f28620d5035	f4a299aa-1f0f-4162-8c42-1fa13b12e305	failed	0	\N	\N	\N	2026-10-13 04:41:17.695398+00
7d3ac699-0d4d-4ba7-a50a-3f13da6b2f17	dbe073ea-37cd-4a2a-9e71-d7f29c912c54	failed	1	\N	2026-10-13 06:39:12.795118+00	\N	2026-10-13 06:39:12.753702+00
0767c73a-e954-40a9-875b-6f7e793e07bf	f62fdf35-ba23-4d53-a610-6c8d93306a5f	failed	2	\N	2026-10-13 07:18:37.975117+00	\N	2026-10-13 06:43:30.847221+00
97c4b02c-305d-4916-8842-c0ad7be0141c	0e978792-8612-450a-9095-902fc5c06248	failed	2	\N	2026-10-13 07:18:38.202939+00	\N	2026-10-13 07:03:31.676592+00
d5528c16-1596-4c34-b9ca-a9ea2413e7a9	24e2bebe-bd39-464d-88e1-c78cef446c30	completed	6	ProgrammingError	2026-10-13 07:46:58.407574+00	2026-10-13 07:46:58.480998+00	2026-10-13 07:29:29.059257+00
\.


--
-- Data for Name: message_sources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_sources (id, message_id, document_id, chunk_id, page_number, document_name) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, role, content, created_at) FROM stdin;
37162495-3c02-401a-924a-736500341677	855cbf25-5276-4c6e-ba1d-9a993bead59f	user	apa isi dokumen?	2026-10-13 07:02:03.589772+00
ead3b481-1f82-442f-a0fe-bcb8a1d05b7c	855cbf25-5276-4c6e-ba1d-9a993bead59f	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:02:03.626974+00
bbb4e18e-4e2b-4e3c-bc5b-055957d8d892	7c24e178-10a5-406a-9203-5085af4e860b	user	apa itu RAG dan bagaimana cara kerjanya?	2026-10-13 07:20:27.734716+00
bc9f84d5-5daf-4e06-9790-9b8c8e0822e5	7c24e178-10a5-406a-9203-5085af4e860b	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:20:27.765275+00
1aa9035f-7f40-410e-ae66-3b210d7d76f7	d1d75079-18b0-4fe0-9096-b15fc6a39212	user	apa isi test laporan ?	2026-10-13 07:51:25.469125+00
e6de7787-37ae-4827-8c05-1e3f8ad0efa1	d1d75079-18b0-4fe0-9096-b15fc6a39212	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:51:25.517911+00
f4cb8f2e-af3d-483e-96f3-04d8a42a38e1	d1d75079-18b0-4fe0-9096-b15fc6a39212	user	ada dokument apa?	2026-10-13 07:51:37.230978+00
7543297c-9f36-47cf-b8d9-a5e3c362a5c8	d1d75079-18b0-4fe0-9096-b15fc6a39212	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:51:37.268219+00
e08a0e8a-90d0-49ea-b0b4-67a36229411a	d1d75079-18b0-4fe0-9096-b15fc6a39212	user	hai	2026-10-13 07:51:43.189816+00
ec974220-3ae1-457b-9475-b830f06046ce	d1d75079-18b0-4fe0-9096-b15fc6a39212	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:51:43.213312+00
3be0fbc1-2f72-46d9-9eec-ff907816b254	8d63e821-4582-437e-bd97-8b815b34528b	user	Berapa pendapatan perusahaan ABC pada tahun 2024?	2026-10-13 07:54:24.497129+00
8d2c285f-835c-4c42-944a-d6039f3c3790	8d63e821-4582-437e-bd97-8b815b34528b	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:54:24.521276+00
ae692bfc-1bb1-4329-9e48-725e0f31ec51	d8f3046c-406f-4694-96e1-ef2d3f1b4376	user	Apa rencana ekspansi perusahaan ABC untuk tahun 2025?	2026-10-13 07:54:24.60559+00
c5c9bfd2-e1e1-4614-89c6-94da8ff8a46f	d8f3046c-406f-4694-96e1-ef2d3f1b4376	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:54:24.629373+00
c95eb452-0e3c-40b5-a025-6e14a6e9140c	da3ecdfc-b340-4f60-87e1-145b586bbb2e	user	Berapa jumlah karyawan perusahaan ABC?	2026-10-13 07:54:24.700669+00
28bb08e9-68ce-46d8-a083-2ddbbb6437e0	da3ecdfc-b340-4f60-87e1-145b586bbb2e	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 07:54:24.717118+00
1c0b018e-2efe-424b-8ce6-3f36466cee93	08ae2b0f-2ed6-44a7-ace5-f7d26f54b399	user	Berapa pendapatan perusahaan ABC pada tahun 2024?	2026-10-13 08:01:56.183798+00
30a66732-84d7-47f8-bc9f-9b73f27dd008	08ae2b0f-2ed6-44a7-ace5-f7d26f54b399	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 08:01:56.219742+00
79e51d33-d8bd-423f-8b84-9196d9ebc04b	21bd4e49-659f-4378-bbd3-12156f3f05c5	user	Apa rencana ekspansi perusahaan ABC untuk tahun 2025?	2026-10-13 08:01:56.271245+00
80779793-af71-48ca-820b-de397b190aaa	21bd4e49-659f-4378-bbd3-12156f3f05c5	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 08:01:56.291814+00
f64225a8-9aee-4b0a-8d39-de9635bf5a59	5db1424e-9111-493c-9439-c590fe38baac	user	Berapa jumlah karyawan perusahaan ABC?	2026-10-13 08:01:56.334687+00
362aae29-ff2e-4ef3-923a-8c6de41c4394	5db1424e-9111-493c-9439-c590fe38baac	assistant	Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.	2026-10-13 08:01:56.353182+00
50c4e426-ac35-40b9-9cfa-6e89d28e2ada	b16bfa12-ef60-4719-96c9-9b675ed2dea2	user	Berapa pendapatan perusahaan ABC pada tahun 2024?	2026-10-13 08:14:51.421506+00
4c5a8417-b49f-4740-a257-ea2618170cd6	b16bfa12-ef60-4719-96c9-9b675ed2dea2	assistant	Berdasarkan dokumen yang tersedia:\n\n[Sumber: test_laporan.pdf, Hal. 1]\nLAPORAN TAHUNAN PERUSAHAAN ABC 2024 1. PENDAHULUAN Perusahaan ABC didirikan tahun 2010 di bidang teknologi informasi. Pendapatan 2024 mencapai Rp 50 miliar. 2. PRODUK UNGGULAN - Sistem Manajemen Dokumen digunakan 200 perusahaan di Indonesia. - Platform AI Chatbot untuk customer service 24 jam. - Cloud Storage kapasitas hingga 10 TB per klien. 3. PENCAPAIAN 2024 Sertifikasi ISO 27001 untuk keamanan informasi berhasil diperoleh. Tim RnD menghasilkan 5 paten tekno...\n\n[Mode mock aktif — integrasikan OpenAI API untuk jawaban nyata]	2026-10-13 08:14:51.595709+00
7441c2d9-5389-4fc6-acb2-68083e44e0a0	a492136b-57c4-495f-9c08-cb963d9fcdc8	user	Apa rencana ekspansi perusahaan ABC untuk tahun 2025?	2026-10-13 08:14:51.651015+00
91228364-2609-4fb3-af68-de35bc86236b	a492136b-57c4-495f-9c08-cb963d9fcdc8	assistant	Berdasarkan dokumen yang tersedia:\n\n[Sumber: test_laporan.pdf, Hal. 1]\nLAPORAN TAHUNAN PERUSAHAAN ABC 2024 1. PENDAHULUAN Perusahaan ABC didirikan tahun 2010 di bidang teknologi informasi. Pendapatan 2024 mencapai Rp 50 miliar. 2. PRODUK UNGGULAN - Sistem Manajemen Dokumen digunakan 200 perusahaan di Indonesia. - Platform AI Chatbot untuk customer service 24 jam. - Cloud Storage kapasitas hingga 10 TB per klien. 3. PENCAPAIAN 2024 Sertifikasi ISO 27001 untuk keamanan informasi berhasil diperoleh. Tim RnD menghasilkan 5 paten tekno...\n\n[Mode mock aktif — integrasikan OpenAI API untuk jawaban nyata]	2026-10-13 08:14:51.674091+00
8092aa77-04ec-46b3-8a79-d87216e4f9fd	ff04ca88-f514-4111-87d9-80c4f67b487d	user	Berapa jumlah karyawan perusahaan ABC?	2026-10-13 08:14:51.749085+00
286abdce-b792-4a13-82fe-c7feac812618	ff04ca88-f514-4111-87d9-80c4f67b487d	assistant	Berdasarkan dokumen yang tersedia:\n\n[Sumber: test_laporan.pdf, Hal. 1]\nLAPORAN TAHUNAN PERUSAHAAN ABC 2024 1. PENDAHULUAN Perusahaan ABC didirikan tahun 2010 di bidang teknologi informasi. Pendapatan 2024 mencapai Rp 50 miliar. 2. PRODUK UNGGULAN - Sistem Manajemen Dokumen digunakan 200 perusahaan di Indonesia. - Platform AI Chatbot untuk customer service 24 jam. - Cloud Storage kapasitas hingga 10 TB per klien. 3. PENCAPAIAN 2024 Sertifikasi ISO 27001 untuk keamanan informasi berhasil diperoleh. Tim RnD menghasilkan 5 paten tekno...\n\n[Mode mock aktif — integrasikan OpenAI API untuk jawaban nyata]	2026-10-13 08:14:51.768909+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, hashed_password, full_name, role, is_active, created_at, updated_at) FROM stdin;
b98b02cb-f3e9-46bc-8583-5ed527269fa1	admin@example.com	$2b$12$lhmtL3HlfvJuxmT3n8U9tOEcwz8K3WOFCvZkJ6xiHLGbA708Mpqze	Admin User	admin	t	2026-10-13 04:03:57.326422+00	2026-10-13 04:03:57.326422+00
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: document_embeddings document_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_embeddings
    ADD CONSTRAINT document_embeddings_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: ingestion_jobs ingestion_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_jobs
    ADD CONSTRAINT ingestion_jobs_pkey PRIMARY KEY (id);


--
-- Name: message_sources message_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sources
    ADD CONSTRAINT message_sources_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_doc_embeddings_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_embeddings_vector ON public.document_embeddings USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='10');


--
-- Name: ix_conversations_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_conversations_owner_id ON public.conversations USING btree (owner_id);


--
-- Name: ix_document_chunks_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_document_chunks_document_id ON public.document_chunks USING btree (document_id);


--
-- Name: ix_document_embeddings_chunk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_document_embeddings_chunk_id ON public.document_embeddings USING btree (chunk_id);


--
-- Name: ix_documents_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_documents_owner_id ON public.documents USING btree (owner_id);


--
-- Name: ix_ingestion_jobs_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ingestion_jobs_document_id ON public.ingestion_jobs USING btree (document_id);


--
-- Name: ix_message_sources_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_message_sources_message_id ON public.message_sources USING btree (message_id);


--
-- Name: ix_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: document_chunks document_chunks_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_embeddings document_embeddings_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_embeddings
    ADD CONSTRAINT document_embeddings_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.document_chunks(id) ON DELETE CASCADE;


--
-- Name: documents documents_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ingestion_jobs ingestion_jobs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_jobs
    ADD CONSTRAINT ingestion_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: message_sources message_sources_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sources
    ADD CONSTRAINT message_sources_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.document_chunks(id) ON DELETE SET NULL;


--
-- Name: message_sources message_sources_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sources
    ADD CONSTRAINT message_sources_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: message_sources message_sources_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sources
    ADD CONSTRAINT message_sources_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict SGF89HXSO7C7fn3BcxdcQFXpBSEJQxD3ij49LR1w15rFdSkEa7SVQQMn6BKK9xf

